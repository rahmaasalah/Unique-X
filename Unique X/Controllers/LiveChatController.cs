using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs.Chat;
using Unique_X.Helpers;
using Unique_X.Hubs;
using Unique_X.Models;

namespace Unique_X.Controllers
{
    // 🟢 Live Chat عام: القراءة والإرسال من غير تسجيل دخول. التثبيت والمسح للأدمن بس.
    [ApiController]
    [AllowAnonymous]
    [Route("api/livechat")]
    public class LiveChatController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<LiveChatHub> _hub;

        public LiveChatController(AppDbContext db, IHubContext<LiveChatHub> hub)
        {
            _db = db;
            _hub = hub;
        }

        private string? MyId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        private bool IsAdmin => User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");

        // GET api/livechat/messages?before=120&take=40
        [HttpGet("messages")]
        public async Task<IActionResult> GetMessages([FromQuery] long? before, [FromQuery] int take = 40)
        {
            take = Math.Clamp(take, 1, 100);
            var q = _db.LiveChatMessages.AsNoTracking().Where(m => !m.IsDeleted);
            if (before.HasValue) q = q.Where(m => m.Id < before.Value);

            var list = await q.OrderByDescending(m => m.Id).Take(take).ToListAsync();
            list.Reverse();
            return Ok(await Map(list));
        }

        // GET api/livechat/pinned  (كل العناصر المثبتة في الشات كله)
        [HttpGet("pinned")]
        public async Task<IActionResult> GetPinned()
        {
            var list = await _db.LiveChatMessages.AsNoTracking()
                .Where(m => m.IsPinned && !m.IsDeleted)
                .OrderByDescending(m => m.PinnedAt)
                .ToListAsync();
            return Ok(await Map(list));
        }

        // POST api/livechat/messages  (form-data: guestName, guestKey, text, propertyCode, leadRequestId, anonymous)
        [HttpPost("messages")]
        [EnableRateLimiting("livechat")]
        public async Task<IActionResult> Send([FromForm] LiveSendForm form)
        {
            var text = form.Text?.Trim();
            if (string.IsNullOrEmpty(text)) text = null;

            // هوية المرسل: مسجل دخول → اسمه وصورته، وإلا اسم الزائر
            string? userId = MyId;
            var realUserId = MyId;   // للتحقق من الصلاحيات (حتى لو بعت Anonymous)
            string name;
            string? image = null;
            string? guestKey = null;

            if (!string.IsNullOrEmpty(userId))
            {
                var u = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == userId);
                if (u == null || !u.IsActive) return Unauthorized();

                if (form.Anonymous)
                {
                    // 🟢 إرسال Anonymous: مبنخزنش هوية المسجل خالص، وبنستخدم معرّف المتصفح عشان الرسالة تظهر "بتاعتي" عنده
                    name = "Anonymous";
                    guestKey = string.IsNullOrWhiteSpace(form.GuestKey) ? null : form.GuestKey.Trim();
                    userId = null;
                }
                else
                {
                    name = $"{u.FirstName} {u.LastName}".Trim();
                    image = u.ProfileImageUrl;
                }
            }
            else
            {
                name = (form.GuestName ?? "").Trim();
                if (name.Length < 2) name = "Guest";
                guestKey = string.IsNullOrWhiteSpace(form.GuestKey) ? null : form.GuestKey.Trim();
            }

            // كود الوحدة: صراحة أو الرسالة كلها كود
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
                if (propertyId != null) text = null;
            }

            // طلب عميل (للبروكر فقط، وبيتبعت منه نسخة من غير بيانات شخصية)
            string? requestJson = null;
            if (form.LeadRequestId.HasValue)
            {
                if (string.IsNullOrEmpty(realUserId) || !User.IsInRole("Broker")) return Forbid();
                var rq = await ChatShareHelper.BuildAsync(_db, realUserId, form.LeadRequestId.Value);
                if (rq == null) return BadRequest("Request not found.");
                requestJson = ChatShareHelper.Serialize(rq);
            }

            if (text == null && propertyId == null && requestJson == null) return BadRequest("Message is empty.");

            var msg = new LiveChatMessage
            {
                SenderUserId = userId,
                SenderName = name.Length > 60 ? name[..60] : name,
                SenderImage = image,
                GuestKey = guestKey,
                Text = text,
                PropertyId = propertyId,
                RequestJson = requestJson,
                CreatedAt = DateTime.UtcNow
            };
            _db.LiveChatMessages.Add(msg);
            await _db.SaveChangesAsync();

            var dto = (await Map(new List<LiveChatMessage> { msg })).First();
            await _hub.Clients.Group(LiveChatHub.Group).SendAsync("LiveMessage", dto);
            return Ok(dto);
        }

        // POST api/livechat/messages/5/pin  |  /unpin   (أدمن فقط)
        [HttpPost("messages/{id:long}/pin")]
        public Task<IActionResult> Pin(long id) => SetPin(id, true);

        [HttpPost("messages/{id:long}/unpin")]
        public Task<IActionResult> Unpin(long id) => SetPin(id, false);

        private async Task<IActionResult> SetPin(long id, bool pin)
        {
            if (User.Identity?.IsAuthenticated != true) return Unauthorized();
            if (!IsAdmin) return Forbid();

            var msg = await _db.LiveChatMessages.FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);
            if (msg == null) return NotFound();

            if (pin)
            {
                var me = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == MyId);
                msg.IsPinned = true;
                msg.PinnedAt = DateTime.UtcNow;
                msg.PinnedByName = me == null ? "Admin" : $"{me.FirstName} {me.LastName}".Trim();
            }
            else
            {
                msg.IsPinned = false;
                msg.PinnedAt = null;
                msg.PinnedByName = null;
            }
            await _db.SaveChangesAsync();

            var dto = (await Map(new List<LiveChatMessage> { msg })).First();
            await _hub.Clients.Group(LiveChatHub.Group).SendAsync("LivePinChanged", dto);
            return Ok(dto);
        }

        // DELETE api/livechat/messages/5   (أدمن فقط)
        [HttpDelete("messages/{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            if (User.Identity?.IsAuthenticated != true) return Unauthorized();
            if (!IsAdmin) return Forbid();

            var msg = await _db.LiveChatMessages.FirstOrDefaultAsync(m => m.Id == id);
            if (msg == null) return NotFound();

            msg.IsDeleted = true;
            msg.IsPinned = false;
            msg.PinnedAt = null;
            await _db.SaveChangesAsync();

            await _hub.Clients.Group(LiveChatHub.Group).SendAsync("LiveDeleted", id);
            return Ok();
        }

        // ---------- Helpers ----------

        private async Task<int?> FindPropertyIdByCode(string code)
        {
            return await _db.Properties.AsNoTracking()
                .Where(p => p.Code == code && p.IsApproved && p.IsActive && !p.IsSuspended)
                .Select(p => (int?)p.Id)
                .FirstOrDefaultAsync();
        }

        private async Task<List<LiveMessageDto>> Map(List<LiveChatMessage> msgs)
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

            return msgs.Select(m => new LiveMessageDto
            {
                Id = m.Id,
                SenderKey = m.SenderUserId ?? m.GuestKey ?? "",
                SenderName = m.SenderName,
                SenderImage = m.SenderImage,
                IsGuest = m.SenderUserId == null,
                Text = m.Text,
                ImageUrl = m.ImageUrl,
                Request = ChatShareHelper.Deserialize(m.RequestJson),
                Property = m.PropertyId != null && props.TryGetValue(m.PropertyId.Value, out var pr) ? pr : null,
                IsPinned = m.IsPinned,
                PinnedAt = m.PinnedAt.HasValue ? DateTime.SpecifyKind(m.PinnedAt.Value, DateTimeKind.Utc) : null,
                PinnedByName = m.PinnedByName,
                CreatedAt = DateTime.SpecifyKind(m.CreatedAt, DateTimeKind.Utc)
            }).ToList();
        }
    }
}