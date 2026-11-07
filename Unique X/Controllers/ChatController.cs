using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs.Chat;
using Unique_X.Hubs;
using Unique_X.Models;
using Unique_X.Services.Interface;

namespace Unique_X.Controllers
{
    // 🟢 شات بين اليوزرز: محادثات مباشرة + رومات مفتوحة بلينك دعوة
    [ApiController]
    [Authorize]
    [Route("api/chat")]
    public class ChatController : ControllerBase
    {
        private const int MaxImageBytes = 5 * 1024 * 1024;

        private readonly AppDbContext _db;
        private readonly IHubContext<ChatHub> _hub;
        private readonly IPhotoService _photos;

        public ChatController(AppDbContext db, IHubContext<ChatHub> hub, IPhotoService photos)
        {
            _db = db;
            _hub = hub;
            _photos = photos;
        }

        private string Me => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";

        private static string FullName(ApplicantUser? u) =>
            u == null ? "Unknown" : $"{u.FirstName} {u.LastName}".Trim();

        // ---------- Users (للبحث وبدء محادثة) ----------

        // GET api/chat/users?q=ahmed
        [HttpGet("users")]
        public async Task<IActionResult> SearchUsers([FromQuery] string? q)
        {
            q = (q ?? "").Trim();
            if (q.Length < 2) return Ok(new List<ChatUserDto>());

            var me = Me;
            var users = await _db.Users.AsNoTracking()
                .Where(u => u.IsActive && u.Id != me &&
                            ((u.FirstName + " " + u.LastName).Contains(q) ||
                             (u.BrokerCode != null && u.BrokerCode == q)))
                .OrderBy(u => u.FirstName)
                .Take(20)
                .Select(u => new ChatUserDto
                {
                    Id = u.Id,
                    Name = (u.FirstName + " " + u.LastName).Trim(),
                    ImageUrl = u.ProfileImageUrl,
                    UserType = u.UserType
                })
                .ToListAsync();

            return Ok(users);
        }

        // ---------- Conversations ----------

        // GET api/chat/conversations
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var me = Me;

            var rows = await _db.ChatParticipants.AsNoTracking()
                .Where(p => p.UserId == me)
                .Select(p => new
                {
                    p.Conversation!.Id,
                    p.Conversation.Type,
                    p.Conversation.Name,
                    p.Conversation.InviteCode,
                    p.Conversation.LastMessageAt,
                    MembersCount = p.Conversation.Participants.Count,
                    Last = p.Conversation.Messages
                        .OrderByDescending(m => m.Id)
                        .Select(m => new { m.Text, m.ImageUrl, m.PropertyId })
                        .FirstOrDefault()
                })
                .ToListAsync();

            var ids = rows.Select(r => r.Id).ToList();

            var unread = await (
                from m in _db.ChatMessages
                join p in _db.ChatParticipants on m.ConversationId equals p.ConversationId
                where p.UserId == me && m.SenderId != me && m.CreatedAt > p.LastReadAt && ids.Contains(m.ConversationId)
                group m by m.ConversationId into g
                select new { Id = g.Key, Count = g.Count() }
            ).ToDictionaryAsync(x => x.Id, x => x.Count);

            // الطرف التاني في المحادثات المباشرة
            var others = await _db.ChatParticipants.AsNoTracking()
                .Where(p => ids.Contains(p.ConversationId) && p.UserId != me && p.Conversation!.Type == 0)
                .Select(p => new { p.ConversationId, p.User!.FirstName, p.User.LastName, p.User.ProfileImageUrl })
                .ToListAsync();
            var otherByConv = others.GroupBy(o => o.ConversationId).ToDictionary(g => g.Key, g => g.First());

            var result = rows.Select(r =>
            {
                string title = r.Name ?? "Room";
                string? img = null;
                if (r.Type == 0 && otherByConv.TryGetValue(r.Id, out var o))
                {
                    title = $"{o.FirstName} {o.LastName}".Trim();
                    img = o.ProfileImageUrl;
                }

                string? preview = null;
                if (r.Last != null)
                    preview = !string.IsNullOrWhiteSpace(r.Last.Text) ? r.Last.Text
                            : r.Last.PropertyId != null ? "🏠 Property"
                            : r.Last.ImageUrl != null ? "📷 Photo" : null;

                return new ConversationDto
                {
                    Id = r.Id,
                    Type = r.Type,
                    Title = title,
                    ImageUrl = img,
                    InviteCode = r.Type == 1 ? r.InviteCode : null,
                    MembersCount = r.MembersCount,
                    UnreadCount = unread.TryGetValue(r.Id, out var c) ? c : 0,
                    LastMessage = preview,
                    LastMessageAt = DateTime.SpecifyKind(r.LastMessageAt, DateTimeKind.Utc)
                };
            })
            .OrderByDescending(c => c.LastMessageAt)
            .ToList();

            return Ok(result);
        }

        // GET api/chat/conversations/5  (تفاصيل + الأعضاء)
        [HttpGet("conversations/{id:int}")]
        public async Task<IActionResult> GetConversation(int id)
        {
            var dto = await BuildConversationDto(id, Me, includeMembers: true);
            return dto == null ? NotFound() : Ok(dto);
        }

        // POST api/chat/direct  { userId }
        [HttpPost("direct")]
        public async Task<IActionResult> StartDirect([FromBody] StartDirectDto dto)
        {
            var me = Me;
            if (dto.UserId == me) return BadRequest("You can't chat with yourself.");

            var other = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == dto.UserId && u.IsActive);
            if (other == null) return NotFound("User not found.");

            var key = string.CompareOrdinal(me, dto.UserId) < 0 ? $"{me}_{dto.UserId}" : $"{dto.UserId}_{me}";

            var conv = await _db.ChatConversations.FirstOrDefaultAsync(c => c.DirectKey == key);
            if (conv == null)
            {
                conv = new ChatConversation { Type = 0, DirectKey = key, CreatedById = me };
                conv.Participants.Add(new ChatParticipant { UserId = me });
                conv.Participants.Add(new ChatParticipant { UserId = dto.UserId });
                _db.ChatConversations.Add(conv);
                try { await _db.SaveChangesAsync(); }
                catch (DbUpdateException)
                {
                    // لو الاتنين فتحوا في نفس اللحظة، نرجع الموجود
                    _db.ChangeTracker.Clear();
                    conv = await _db.ChatConversations.FirstAsync(c => c.DirectKey == key);
                }
            }

            return Ok(await BuildConversationDto(conv.Id, me, includeMembers: false));
        }

        // POST api/chat/rooms  { name }
        [HttpPost("rooms")]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomDto dto)
        {
            var name = (dto.Name ?? "").Trim();
            if (name.Length == 0) return BadRequest("Room name is required.");

            var me = Me;
            var conv = new ChatConversation
            {
                Type = 1,
                Name = name,
                CreatedById = me,
                InviteCode = Convert.ToHexString(RandomNumberGenerator.GetBytes(10)).ToLowerInvariant()
            };
            conv.Participants.Add(new ChatParticipant { UserId = me });
            _db.ChatConversations.Add(conv);
            await _db.SaveChangesAsync();

            return Ok(await BuildConversationDto(conv.Id, me, includeMembers: false));
        }

        // POST api/chat/rooms/join  { inviteCode }
        [HttpPost("rooms/join")]
        public async Task<IActionResult> JoinRoom([FromBody] JoinRoomDto dto)
        {
            var code = (dto.InviteCode ?? "").Trim().ToLowerInvariant();
            if (code.Length == 0) return BadRequest("Invite code is required.");

            var conv = await _db.ChatConversations.FirstOrDefaultAsync(c => c.Type == 1 && c.InviteCode == code);
            if (conv == null) return NotFound("This invitation link is not valid.");

            var me = Me;
            var already = await _db.ChatParticipants.AnyAsync(p => p.ConversationId == conv.Id && p.UserId == me);
            if (!already)
            {
                _db.ChatParticipants.Add(new ChatParticipant { ConversationId = conv.Id, UserId = me });
                await _db.SaveChangesAsync();
            }

            return Ok(await BuildConversationDto(conv.Id, me, includeMembers: false));
        }

        // POST api/chat/conversations/5/leave  (للرومات بس)
        [HttpPost("conversations/{id:int}/leave")]
        public async Task<IActionResult> Leave(int id)
        {
            var me = Me;
            var part = await _db.ChatParticipants
                .Include(p => p.Conversation)
                .FirstOrDefaultAsync(p => p.ConversationId == id && p.UserId == me);
            if (part == null) return NotFound();
            if (part.Conversation!.Type != 1) return BadRequest("You can only leave rooms.");

            _db.ChatParticipants.Remove(part);
            await _db.SaveChangesAsync();
            return Ok();
        }

        // ---------- Messages ----------

        // GET api/chat/conversations/5/messages?before=120&take=40
        [HttpGet("conversations/{id:int}/messages")]
        public async Task<IActionResult> GetMessages(int id, [FromQuery] long? before, [FromQuery] int take = 40)
        {
            if (!await IsMember(id)) return NotFound();
            take = Math.Clamp(take, 1, 100);

            var q = _db.ChatMessages.AsNoTracking().Include(m => m.Sender)
                .Where(m => m.ConversationId == id);
            if (before.HasValue) q = q.Where(m => m.Id < before.Value);

            var msgs = await q.OrderByDescending(m => m.Id).Take(take).ToListAsync();
            msgs.Reverse(); // الأقدم الأول

            return Ok(await MapMessages(msgs));
        }

        // POST api/chat/conversations/5/messages  (multipart/form-data: text, propertyCode, image)
        [HttpPost("conversations/{id:int}/messages")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> SendMessage(int id, [FromForm] SendMessageForm form)
        {
            var me = Me;
            if (!await IsMember(id)) return NotFound();

            var text = form.Text?.Trim();
            if (string.IsNullOrEmpty(text)) text = null;

            // 1) كود الوحدة: إما مكتوب صراحة، أو الرسالة كلها عبارة عن كود وحدة موجودة
            int? propertyId = null;
            var codeInput = form.PropertyCode?.Trim();
            if (!string.IsNullOrEmpty(codeInput))
            {
                propertyId = await FindPropertyIdByCode(codeInput);
                if (propertyId == null) return BadRequest("Property code not found.");
            }
            else if (text != null && text.Length <= 60 && !text.Contains(' '))
            {
                propertyId = await FindPropertyIdByCode(text);
                if (propertyId != null) text = null; // الرسالة كلها كود → بتظهر كارت وحدة
            }

            // 2) الصورة
            string? imageUrl = null;
            if (form.Image != null && form.Image.Length > 0)
            {
                if (!(form.Image.ContentType ?? "").StartsWith("image/"))
                    return BadRequest("Only image files are allowed.");
                if (form.Image.Length > MaxImageBytes)
                    return BadRequest("Image is too large (max 5 MB).");

                var up = await _photos.AddPhotoAsync(form.Image);
                if (up.Error != null || up.SecureUrl == null)
                    return BadRequest("Could not upload the image.");
                imageUrl = up.SecureUrl.ToString();
            }

            if (text == null && imageUrl == null && propertyId == null)
                return BadRequest("Message is empty.");

            var now = DateTime.UtcNow;
            var msg = new ChatMessage
            {
                ConversationId = id,
                SenderId = me,
                Text = text,
                ImageUrl = imageUrl,
                PropertyId = propertyId,
                CreatedAt = now
            };
            _db.ChatMessages.Add(msg);

            var conv = await _db.ChatConversations.FirstAsync(c => c.Id == id);
            conv.LastMessageAt = now;

            // اللي بيبعت يعتبر قرا المحادثة لحد دلوقتي
            var mine = await _db.ChatParticipants.FirstAsync(p => p.ConversationId == id && p.UserId == me);
            mine.LastReadAt = now;

            await _db.SaveChangesAsync();

            msg = await _db.ChatMessages.AsNoTracking().Include(m => m.Sender).FirstAsync(m => m.Id == msg.Id);
            var dto = (await MapMessages(new List<ChatMessage> { msg })).First();

            var memberIds = await _db.ChatParticipants.AsNoTracking()
                .Where(p => p.ConversationId == id).Select(p => p.UserId).ToListAsync();
            await _hub.Clients.Users(memberIds).SendAsync("ReceiveMessage", dto);

            return Ok(dto);
        }

        // POST api/chat/conversations/5/read
        [HttpPost("conversations/{id:int}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var me = Me;
            var part = await _db.ChatParticipants.FirstOrDefaultAsync(p => p.ConversationId == id && p.UserId == me);
            if (part == null) return NotFound();
            part.LastReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok();
        }

        // GET api/chat/unread-count  (للبادج في النافبار)
        [HttpGet("unread-count")]
        public async Task<IActionResult> UnreadCount()
        {
            var me = Me;
            var count = await (
                from m in _db.ChatMessages
                join p in _db.ChatParticipants on m.ConversationId equals p.ConversationId
                where p.UserId == me && m.SenderId != me && m.CreatedAt > p.LastReadAt
                select m.Id
            ).CountAsync();
            return Ok(new { count });
        }

        // ---------- Helpers ----------

        private Task<bool> IsMember(int conversationId)
        {
            var me = Me;
            return _db.ChatParticipants.AnyAsync(p => p.ConversationId == conversationId && p.UserId == me);
        }

        private async Task<int?> FindPropertyIdByCode(string code)
        {
            var id = await _db.Properties.AsNoTracking()
                .Where(p => p.Code == code && p.IsApproved && p.IsActive && !p.IsSuspended)
                .Select(p => (int?)p.Id)
                .FirstOrDefaultAsync();
            return id;
        }

        private async Task<List<ChatMessageDto>> MapMessages(List<ChatMessage> msgs)
        {
            var propIds = msgs.Where(m => m.PropertyId != null).Select(m => m.PropertyId!.Value).Distinct().ToList();
            var props = new Dictionary<int, ChatPropertyDto>();

            if (propIds.Count > 0)
            {
                var rows = await _db.Properties.AsNoTracking()
                    .Where(p => propIds.Contains(p.Id))
                    .Select(p => new
                    {
                        p.Id,
                        p.Code,
                        p.Title,
                        p.Price,
                        p.City,
                        p.Region,
                        Image = p.Photos
                            .OrderByDescending(ph => ph.IsMain).ThenBy(ph => ph.DisplayOrder)
                            .Select(ph => ph.Url).FirstOrDefault()
                    })
                    .ToListAsync();

                foreach (var p in rows)
                    props[p.Id] = new ChatPropertyDto
                    {
                        Id = p.Id,
                        Code = p.Code,
                        Title = p.Title,
                        Price = p.Price,
                        City = p.City.ToString(),
                        Region = p.Region,
                        ImageUrl = p.Image
                    };
            }

            return msgs.Select(m => new ChatMessageDto
            {
                Id = m.Id,
                ConversationId = m.ConversationId,
                SenderId = m.SenderId,
                SenderName = FullName(m.Sender),
                SenderImage = m.Sender?.ProfileImageUrl,
                Text = m.Text,
                ImageUrl = m.ImageUrl,
                Property = m.PropertyId != null && props.TryGetValue(m.PropertyId.Value, out var pr) ? pr : null,
                CreatedAt = DateTime.SpecifyKind(m.CreatedAt, DateTimeKind.Utc)
            }).ToList();
        }

        private async Task<ConversationDto?> BuildConversationDto(int id, string me, bool includeMembers)
        {
            var conv = await _db.ChatConversations.AsNoTracking()
                .Include(c => c.Participants).ThenInclude(p => p.User)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (conv == null || !conv.Participants.Any(p => p.UserId == me)) return null;

            string title = conv.Name ?? "Room";
            string? img = null;
            if (conv.Type == 0)
            {
                var other = conv.Participants.FirstOrDefault(p => p.UserId != me)?.User;
                title = FullName(other);
                img = other?.ProfileImageUrl;
            }

            return new ConversationDto
            {
                Id = conv.Id,
                Type = conv.Type,
                Title = title,
                ImageUrl = img,
                InviteCode = conv.Type == 1 ? conv.InviteCode : null,
                MembersCount = conv.Participants.Count,
                LastMessageAt = DateTime.SpecifyKind(conv.LastMessageAt, DateTimeKind.Utc),
                Members = includeMembers
                    ? conv.Participants.Select(p => new ChatMemberDto
                    {
                        UserId = p.UserId,
                        Name = FullName(p.User),
                        ImageUrl = p.User?.ProfileImageUrl
                    }).ToList()
                    : null
            };
        }
    }
}