using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;

namespace Unique_X.Controllers.CRM
{
    [Route("api/crm/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/crm/notifications?brokerId=X
        // بيرجع آخر 30 إشعار (الأحدث الأول)، مع علامة IsRead لكل واحد
        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] string brokerId)
        {
            if (string.IsNullOrEmpty(brokerId)) return BadRequest("brokerId is required");

            var notifications = await _context.BrokerNotifications
                .Where(n => n.BrokerId == brokerId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(30)
                .ToListAsync();

            return Ok(notifications);
        }

        // PUT: api/crm/notifications/{id}/mark-read
        [HttpPut("{id}/mark-read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.BrokerNotifications.FindAsync(id);
            if (notification == null) return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok(notification);
        }

        // PUT: api/crm/notifications/mark-all-read?brokerId=X
        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead([FromQuery] string brokerId)
        {
            if (string.IsNullOrEmpty(brokerId)) return BadRequest("brokerId is required");

            var unread = await _context.BrokerNotifications
                .Where(n => n.BrokerId == brokerId && !n.IsRead)
                .ToListAsync();

            foreach (var n in unread) n.IsRead = true;

            await _context.SaveChangesAsync();
            return Ok(new { markedCount = unread.Count });
        }
    }
}