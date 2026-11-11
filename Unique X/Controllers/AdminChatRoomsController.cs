using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs.Chat;
using Unique_X.Helpers;
using Unique_X.Services.Interface;

namespace Unique_X.Controllers
{
    // 🟢 تاب Rooms في الأدمن داشبورد: كل الرومات + أعضاؤها + سجل الدخول والخروج
    // الصلاحية: Admin كامل أو صلاحية "chatRooms" (من تاب Authorization)
    [ApiController]
    [Authorize]
    [Route("api/admin/chat-rooms")]
    public class AdminChatRoomsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IPermissionService _permissions;

        public AdminChatRoomsController(AppDbContext db, IPermissionService permissions)
        {
            _db = db;
            _permissions = permissions;
        }

        private Task<bool> Allowed() =>
            _permissions.HasPermissionAsync(User, PermissionCatalog.DashboardAdmin, "chatRooms");

        private static DateTime Utc(DateTime d) => DateTime.SpecifyKind(d, DateTimeKind.Utc);
        private static DateTime? Utc(DateTime? d) => d.HasValue ? Utc(d.Value) : null;

        // GET api/admin/chat-rooms
        [HttpGet]
        public async Task<IActionResult> GetRooms()
        {
            if (!await Allowed()) return Forbid();

            var rooms = await _db.ChatConversations.AsNoTracking()
                .Where(c => c.Type == 1)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.CreatedById,
                    c.CreatedAt,
                    c.LastMessageAt,
                    Current = c.Participants.Count,
                    Messages = c.Messages.Count
                })
                .ToListAsync();

            var ids = rooms.Select(r => r.Id).ToList();

            // اللي دخلوا الروم فعلًا (من السجل + الأعضاء الحاليين اللي ملهمش سجل)
            var logs = await _db.ChatMembershipLogs.AsNoTracking()
                .Where(l => ids.Contains(l.ConversationId))
                .Select(l => new { l.ConversationId, l.UserId, l.LeftAt })
                .ToListAsync();
            var parts = await _db.ChatParticipants.AsNoTracking()
                .Where(p => ids.Contains(p.ConversationId))
                .Select(p => new { p.ConversationId, p.UserId })
                .ToListAsync();

            var creatorIds = rooms.Select(r => r.CreatedById).Distinct().ToList();
            var creators = await _db.Users.AsNoTracking()
                .Where(u => creatorIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FirstName, u.LastName })
                .ToDictionaryAsync(u => u.Id, u => (u.FirstName + " " + u.LastName).Trim());

            var result = rooms.Select(r =>
            {
                var everUsers = logs.Where(l => l.ConversationId == r.Id).Select(l => l.UserId)
                    .Concat(parts.Where(p => p.ConversationId == r.Id).Select(p => p.UserId))
                    .Distinct().Count();

                DateTime? endedAt = null;
                if (r.Current == 0)
                    endedAt = logs.Where(l => l.ConversationId == r.Id && l.LeftAt != null).Max(l => l.LeftAt);

                return new AdminChatRoomListDto
                {
                    Id = r.Id,
                    Name = r.Name ?? "Room",
                    CreatedById = r.CreatedById,
                    CreatedByName = creators.TryGetValue(r.CreatedById, out var n) ? n : "Unknown",
                    CreatedAt = Utc(r.CreatedAt),
                    CurrentMembers = r.Current,
                    TotalMembersEver = everUsers,
                    MessagesCount = r.Messages,
                    LastActivityAt = Utc(r.LastMessageAt),
                    EndedAt = Utc(endedAt)
                };
            })
            .OrderByDescending(r => r.CreatedAt)
            .ToList();

            return Ok(result);
        }

        // GET api/admin/chat-rooms/5  (الأعضاء + كل فترات الدخول والخروج)
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetRoom(int id)
        {
            if (!await Allowed()) return Forbid();

            var room = await _db.ChatConversations.AsNoTracking()
                .Where(c => c.Id == id && c.Type == 1)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.CreatedById,
                    c.CreatedAt,
                    c.LastMessageAt,
                    Messages = c.Messages.Count
                })
                .FirstOrDefaultAsync();
            if (room == null) return NotFound();

            var logs = await _db.ChatMembershipLogs.AsNoTracking()
                .Where(l => l.ConversationId == id)
                .OrderBy(l => l.JoinedAt)
                .ToListAsync();
            var parts = await _db.ChatParticipants.AsNoTracking()
                .Where(p => p.ConversationId == id)
                .ToListAsync();

            // أعضاء حاليين قدام (قبل ميزة السجل) ومالهمش سجل: نعرض وقت دخولهم الأصلي كفترة مفتوحة
            var stints = logs.Select(l => new { l.UserId, l.JoinedAt, l.LeftAt }).ToList();
            foreach (var p in parts)
                if (!logs.Any(l => l.UserId == p.UserId))
                    stints.Add(new { p.UserId, p.JoinedAt, LeftAt = (DateTime?)null });

            var userIds = stints.Select(s => s.UserId).Append(room.CreatedById).Distinct().ToList();
            var users = await _db.Users.AsNoTracking()
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email, u.UserType })
                .ToDictionaryAsync(u => u.Id);

            var currentIds = parts.Select(p => p.UserId).ToHashSet();

            var members = stints
                .GroupBy(s => s.UserId)
                .Select(g =>
                {
                    users.TryGetValue(g.Key, out var u);
                    return new AdminChatMemberDto
                    {
                        UserId = g.Key,
                        Name = u == null ? "Deleted user" : $"{u.FirstName} {u.LastName}".Trim(),
                        Email = u?.Email,
                        UserType = u == null ? "Unknown" : u.UserType == 1 ? "Broker" : "Client",
                        IsCurrent = currentIds.Contains(g.Key),
                        IsCreator = g.Key == room.CreatedById,
                        Stints = g.OrderBy(s => s.JoinedAt)
                                  .Select(s => new AdminChatStintDto { JoinedAt = Utc(s.JoinedAt), LeftAt = Utc(s.LeftAt) })
                                  .ToList()
                    };
                })
                .OrderByDescending(m => m.IsCreator).ThenBy(m => m.Stints.First().JoinedAt)
                .ToList();

            DateTime? endedAt = null;
            if (parts.Count == 0)
                endedAt = stints.Where(s => s.LeftAt != null).Max(s => s.LeftAt);

            var creatorName = users.TryGetValue(room.CreatedById, out var cu)
                ? $"{cu.FirstName} {cu.LastName}".Trim() : "Unknown";

            return Ok(new AdminChatRoomDetailDto
            {
                Id = room.Id,
                Name = room.Name ?? "Room",
                CreatedById = room.CreatedById,
                CreatedByName = creatorName,
                CreatedAt = Utc(room.CreatedAt),
                CurrentMembers = parts.Count,
                TotalMembersEver = members.Count,
                MessagesCount = room.Messages,
                LastActivityAt = Utc(room.LastMessageAt),
                EndedAt = Utc(endedAt),
                Members = members
            });
        }
    }
}