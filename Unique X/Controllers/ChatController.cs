using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs.Chat;
using Unique_X.Helpers;
using Unique_X.Hubs;
using Unique_X.Models;

namespace Unique_X.Controllers
{
    // 🟢 شات بين اليوزرز: محادثات مباشرة + رومات مفتوحة بلينك دعوة
    [ApiController]
    [Authorize]
    [Route("api/chat")]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<ChatHub> _hub;

        public ChatController(AppDbContext db, IHubContext<ChatHub> hub)
        {
            _db = db;
            _hub = hub;
        }

        private string Me => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";

        // 🟢 الأدمن عضو ضمني في كل الرومات: بيشوفها كلها وبيقرا ويبعت فيها ويمسح رسائل (من غير ما يتسجل كعضو فعلي)
        private bool IsAdmin => User.IsInRole("Admin");

        private Task<List<string>> AdminIdsAsync() =>
            (from ur in _db.UserRoles
             join r in _db.Roles on ur.RoleId equals r.Id
             where r.Name == "Admin"
             select ur.UserId).Distinct().ToListAsync();

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
                .Select(p => new ConvRow
                {
                    Id = p.Conversation!.Id,
                    Type = p.Conversation.Type,
                    Name = p.Conversation.Name,
                    InviteCode = p.Conversation.InviteCode,
                    LastMessageAt = p.Conversation.LastMessageAt,
                    MembersCount = p.Conversation.Participants.Count,
                    Last = p.Conversation.Messages
                        .OrderByDescending(m => m.Id)
                        .Select(m => new LastRow { Text = m.Text, ImageUrl = m.ImageUrl, PropertyId = m.PropertyId, HasRequest = m.RequestJson != null })
                        .FirstOrDefault()
                })
                .ToListAsync();

            // 🟢 الأدمن: بيضاف ليه كل الرومات اللي مش عضو فعلي فيها (عرض كأدمن)
            var adminIds = new List<string>();
            if (IsAdmin)
            {
                adminIds = await AdminIdsAsync();
                var myIds = rows.Select(r => r.Id).ToList();
                var extra = await _db.ChatConversations.AsNoTracking()
                    .Where(c => c.Type == 1 && !myIds.Contains(c.Id))
                    .Select(c => new ConvRow
                    {
                        Id = c.Id,
                        Type = c.Type,
                        Name = c.Name,
                        InviteCode = c.InviteCode,
                        LastMessageAt = c.LastMessageAt,
                        MembersCount = c.Participants.Count,
                        AdminView = true,
                        Last = c.Messages
                            .OrderByDescending(m => m.Id)
                            .Select(m => new LastRow { Text = m.Text, ImageUrl = m.ImageUrl, PropertyId = m.PropertyId, HasRequest = m.RequestJson != null })
                            .FirstOrDefault()
                    })
                    .ToListAsync();
                rows.AddRange(extra);
            }

            var ids = rows.Select(r => r.Id).ToList();

            // 🟢 عدد الأدمنز اللي مش أعضاء فعليين في كل روم (بيتحسبوا ضمن عدد الأعضاء)
            var adminMembersByConv = adminIds.Count == 0
                ? new Dictionary<int, int>()
                : await _db.ChatParticipants.AsNoTracking()
                    .Where(p => ids.Contains(p.ConversationId) && adminIds.Contains(p.UserId))
                    .GroupBy(p => p.ConversationId)
                    .Select(g => new { Id = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Id, x => x.Count);

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
                            : r.Last.HasRequest ? "📋 Client request"
                            : r.Last.ImageUrl != null ? "📷 Photo" : null;

                return new ConversationDto
                {
                    Id = r.Id,
                    Type = r.Type,
                    Title = title,
                    ImageUrl = img,
                    InviteCode = r.Type == 1 ? r.InviteCode : null,
                    MembersCount = r.MembersCount + (r.Type == 1 ? Math.Max(0, adminIds.Count - (adminMembersByConv.TryGetValue(r.Id, out var am) ? am : 0)) : 0),
                    AdminView = r.AdminView,
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

            // 🟢 سجل العضوية: صاحب الروم دخلها وقت الإنشاء
            _db.ChatMembershipLogs.Add(new ChatMembershipLog { ConversationId = conv.Id, UserId = me, JoinedAt = conv.CreatedAt });
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
                var joinedAt = DateTime.UtcNow;
                _db.ChatParticipants.Add(new ChatParticipant { ConversationId = conv.Id, UserId = me, JoinedAt = joinedAt });
                _db.ChatMembershipLogs.Add(new ChatMembershipLog { ConversationId = conv.Id, UserId = me, JoinedAt = joinedAt });
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

            var leftAt = DateTime.UtcNow;

            // 🟢 نقفل آخر فترة عضوية مفتوحة. لو العضو قديم ومالوش سجل (قبل ميزة السجل) ننشئله سجل بوقت دخوله الأصلي
            var openLog = await _db.ChatMembershipLogs
                .Where(l => l.ConversationId == id && l.UserId == me && l.LeftAt == null)
                .OrderByDescending(l => l.Id)
                .FirstOrDefaultAsync();
            if (openLog != null) openLog.LeftAt = leftAt;
            else _db.ChatMembershipLogs.Add(new ChatMembershipLog
            {
                ConversationId = id,
                UserId = me,
                JoinedAt = part.JoinedAt,
                LeftAt = leftAt
            });

            _db.ChatParticipants.Remove(part);
            await _db.SaveChangesAsync();
            return Ok();
        }

        // ---------- Messages ----------

        // GET api/chat/conversations/5/messages?before=120&take=40
        [HttpGet("conversations/{id:int}/messages")]
        public async Task<IActionResult> GetMessages(int id, [FromQuery] long? before, [FromQuery] int take = 40)
        {
            if (!await CanAccess(id)) return NotFound();
            take = Math.Clamp(take, 1, 100);

            var q = _db.ChatMessages.AsNoTracking().Include(m => m.Sender)
                .Where(m => m.ConversationId == id);
            if (before.HasValue) q = q.Where(m => m.Id < before.Value);

            var msgs = await q.OrderByDescending(m => m.Id).Take(take).ToListAsync();
            msgs.Reverse(); // الأقدم الأول

            return Ok(await MapMessages(msgs));
        }

        // POST api/chat/conversations/5/messages  (form-data: text, propertyCode, leadRequestId)
        [HttpPost("conversations/{id:int}/messages")]
        public async Task<IActionResult> SendMessage(int id, [FromForm] SendMessageForm form)
        {
            var me = Me;
            if (!await CanAccess(id)) return NotFound();

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

            // 2) طلب عميل (للبروكر فقط، وبيتبعت منه نسخة من غير بيانات شخصية)
            string? requestJson = null;
            if (form.LeadRequestId.HasValue)
            {
                if (!User.IsInRole("Broker")) return Forbid();
                var rq = await ChatShareHelper.BuildAsync(_db, me, form.LeadRequestId.Value);
                if (rq == null) return BadRequest("Request not found.");
                requestJson = ChatShareHelper.Serialize(rq);
            }

            if (text == null && propertyId == null && requestJson == null)
                return BadRequest("Message is empty.");

            var now = DateTime.UtcNow;
            var msg = new ChatMessage
            {
                ConversationId = id,
                SenderId = me,
                Text = text,
                PropertyId = propertyId,
                RequestJson = requestJson,
                CreatedAt = now
            };
            _db.ChatMessages.Add(msg);

            var conv = await _db.ChatConversations.FirstAsync(c => c.Id == id);
            conv.LastMessageAt = now;

            // اللي بيبعت يعتبر قرا المحادثة لحد دلوقتي
            var mine = await _db.ChatParticipants.FirstOrDefaultAsync(p => p.ConversationId == id && p.UserId == me);
            if (mine != null) mine.LastReadAt = now; // الأدمن (عضو ضمني) مالوش سجل قراءة

            await _db.SaveChangesAsync();

            msg = await _db.ChatMessages.AsNoTracking().Include(m => m.Sender).FirstAsync(m => m.Id == msg.Id);
            var dto = (await MapMessages(new List<ChatMessage> { msg })).First();

            var memberIds = await _db.ChatParticipants.AsNoTracking()
                .Where(p => p.ConversationId == id).Select(p => p.UserId).ToListAsync();
            if (conv.Type == 1) memberIds = memberIds.Union(await AdminIdsAsync()).ToList(); // الأدمنز بيستلموا رسايل كل الرومات
            await _hub.Clients.Users(memberIds).SendAsync("ReceiveMessage", dto);

            return Ok(dto);
        }

        // DELETE api/chat/conversations/5/messages/120   (أدمن الروم فقط - للرومات بس)
        [HttpDelete("conversations/{id:int}/messages/{messageId:long}")]
        public async Task<IActionResult> DeleteMessage(int id, long messageId)
        {
            if (!IsAdmin) return Forbid();

            var conv = await _db.ChatConversations.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
            if (conv == null || conv.Type != 1) return NotFound();

            var msg = await _db.ChatMessages.FirstOrDefaultAsync(m => m.Id == messageId && m.ConversationId == id);
            if (msg == null) return NotFound();

            _db.ChatMessages.Remove(msg);
            await _db.SaveChangesAsync();

            var recipients = (await _db.ChatParticipants.AsNoTracking()
                .Where(p => p.ConversationId == id).Select(p => p.UserId).ToListAsync())
                .Union(await AdminIdsAsync()).ToList();
            await _hub.Clients.Users(recipients).SendAsync("MessageDeleted", new { conversationId = id, messageId });
            return Ok();
        }

        // POST api/chat/conversations/5/read
        [HttpPost("conversations/{id:int}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var me = Me;
            var part = await _db.ChatParticipants.FirstOrDefaultAsync(p => p.ConversationId == id && p.UserId == me);
            if (part == null)
            {
                // الأدمن في روم مش عضو فيها: مفيش حاجة تتعلّم
                if (await CanAccess(id)) return Ok();
                return NotFound();
            }
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

        // ---------- أدوات البروكر (مشاركة وحداته وطلبات عملائه) ----------

        // GET api/chat/my-properties  (وحدات البروكر المعتمدة والنشطة)
        [HttpGet("my-properties")]
        public async Task<IActionResult> MyProperties()
        {
            if (!User.IsInRole("Broker")) return Forbid();
            var me = Me;

            var rows = await _db.Properties.AsNoTracking()
                .Where(p => p.BrokerId == me && p.IsApproved && p.IsActive && !p.IsSuspended && p.Code != null)
                .OrderByDescending(p => p.Id)
                .Take(200)
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

            return Ok(rows.Select(p => new MyPropertyItemDto
            {
                Id = p.Id,
                Code = p.Code,
                Title = p.Title,
                Price = p.Price,
                City = p.City.ToString(),
                Region = p.Region,
                ImageUrl = p.Image
            }));
        }

        // GET api/chat/my-requests  (طلبات العملاء المسجلين مع البروكر في الـ CRM)
        [HttpGet("my-requests")]
        public async Task<IActionResult> MyRequests()
        {
            if (!User.IsInRole("Broker")) return Forbid();
            var me = Me;

            var rows = await _db.LeadRequests.AsNoTracking()
                .Include(r => r.Lead)
                .Where(r => r.Lead.BrokerId == me && !r.Lead.IsUnassigned)
                .OrderByDescending(r => r.Id)
                .Take(200)
                .ToListAsync();

            return Ok(rows.Select(r => new MyRequestItemDto
            {
                Id = r.Id,
                LeadName = r.Lead.FullName,
                Request = ChatShareHelper.ToDto(r)
            }));
        }

        // ---------- Helpers ----------

        // عضو في المحادثة، أو أدمن والمحادثة روم (الأدمن بيدخل أي روم)
        private async Task<bool> CanAccess(int conversationId)
        {
            var me = Me;
            if (await _db.ChatParticipants.AnyAsync(p => p.ConversationId == conversationId && p.UserId == me)) return true;
            return IsAdmin && await _db.ChatConversations.AnyAsync(c => c.Id == conversationId && c.Type == 1);
        }

        private class LastRow { public string? Text { get; set; } public string? ImageUrl { get; set; } public int? PropertyId { get; set; } public bool HasRequest { get; set; } }
        private class ConvRow
        {
            public int Id { get; set; }
            public int Type { get; set; }
            public string? Name { get; set; }
            public string? InviteCode { get; set; }
            public DateTime LastMessageAt { get; set; }
            public int MembersCount { get; set; }
            public bool AdminView { get; set; }
            public LastRow? Last { get; set; }
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
                Text = ChatShareHelper.MessageText(m.Text, m.RequestJson),
                ImageUrl = m.ImageUrl,
                Request = null, // الطلب بيتعرض كرسالة نصية مطولة (Text) مش كارد
                Property = m.PropertyId != null && props.TryGetValue(m.PropertyId.Value, out var pr) ? pr : null,
                CreatedAt = DateTime.SpecifyKind(m.CreatedAt, DateTimeKind.Utc)
            }).ToList();
        }

        // الأعضاء الفعليين + الأدمنز (لو مش أعضاء فعليين بيتضافوا كأدمن الروم)
        private async Task<List<ChatMemberDto>> BuildMembers(ChatConversation conv, List<string> adminIds)
        {
            var list = conv.Participants.Select(p => new ChatMemberDto
            {
                UserId = p.UserId,
                Name = FullName(p.User),
                ImageUrl = p.User?.ProfileImageUrl,
                IsAdmin = adminIds.Contains(p.UserId)
            }).ToList();

            var missing = adminIds.Where(a => !conv.Participants.Any(p => p.UserId == a)).ToList();
            if (missing.Count > 0)
            {
                var admins = await _db.Users.AsNoTracking().Where(u => missing.Contains(u.Id)).ToListAsync();
                list.AddRange(admins.Select(u => new ChatMemberDto
                {
                    UserId = u.Id,
                    Name = FullName(u),
                    ImageUrl = u.ProfileImageUrl,
                    IsAdmin = true
                }));
            }
            return list;
        }

        private async Task<ConversationDto?> BuildConversationDto(int id, string me, bool includeMembers)
        {
            var conv = await _db.ChatConversations.AsNoTracking()
                .Include(c => c.Participants).ThenInclude(p => p.User)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (conv == null) return null;
            bool isParticipant = conv.Participants.Any(p => p.UserId == me);
            bool adminView = !isParticipant && IsAdmin && conv.Type == 1;
            if (!isParticipant && !adminView) return null;

            var adminIds = conv.Type == 1 ? await AdminIdsAsync() : new List<string>();

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
                MembersCount = conv.Participants.Count + adminIds.Count(a => !conv.Participants.Any(p => p.UserId == a)),
                AdminView = adminView,
                LastMessageAt = DateTime.SpecifyKind(conv.LastMessageAt, DateTimeKind.Utc),
                Members = includeMembers ? await BuildMembers(conv, adminIds) : null
            };
        }
    }
}