using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.Models;

namespace Unique_X.Controllers.CRM
{
    [Route("api/crm/favorites")]
    [ApiController]
    public class LeadFavoritesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeadFavoritesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/crm/favorites?brokerId=xxx
        // البروكر يجيب المفضلة بتاعته
        [HttpGet]
        public async Task<IActionResult> GetFavorites([FromQuery] string brokerId)
        {
            if (string.IsNullOrEmpty(brokerId)) return BadRequest("brokerId is required.");

            var favorites = await _context.LeadFavorites
                .Where(f => f.BrokerId == brokerId)
                .Select(f => f.LeadId)
                .ToListAsync();

            return Ok(favorites);
        }

        // GET: api/crm/favorites/all
        // الأدمن يجيب كل المفضلة من كل البروكرز مع تفاصيل العملاء
        [HttpGet("all")]
        public async Task<IActionResult> GetAllFavorites()
        {
            var favorites = await _context.LeadFavorites
                .Include(f => f.Lead)
                    .ThenInclude(l => l.Status)
                .Include(f => f.Lead)
                    .ThenInclude(l => l.Broker)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new
                {
                    favoriteId = f.Id,
                    leadId = f.LeadId,
                    brokerName = f.BrokerName,
                    addedAt = f.CreatedAt,
                    fullName = f.Lead.FullName,
                    phoneNumber = f.Lead.PhoneNumber,
                    statusName = f.Lead.Status.Name,
                    statusId = f.Lead.LeadStatusId,
                    updatedAt = f.Lead.UpdatedAt ?? f.Lead.CreatedAt,
                    campaignName = string.IsNullOrEmpty(f.Lead.CampaignName) ? "No Campaign" : f.Lead.CampaignName,
                    purpose = _context.LeadRequests
                                    .OrderByDescending(r => r.Id)
                                    .Where(r => r.LeadId == f.LeadId)
                                    .Select(r => r.Purpose)
                                    .FirstOrDefault() ?? "",
                    totalAmount = _context.LeadRequests
                                    .OrderByDescending(r => r.Id)
                                    .Where(r => r.LeadId == f.LeadId)
                                    .Select(r => r.TotalAmount)
                                    .FirstOrDefault() ?? 0,
                    propertyType = _context.LeadRequests
                                    .OrderByDescending(r => r.Id)
                                    .Where(r => r.LeadId == f.LeadId)
                                    .Select(r => r.PropertyType)
                                    .FirstOrDefault() ?? "",
                    preferredLocation = _context.LeadRequests
                                    .OrderByDescending(r => r.Id)
                                    .Where(r => r.LeadId == f.LeadId)
                                    .Select(r => r.PreferredLocation)
                                    .FirstOrDefault() ?? "",
                    notes = _context.LeadRequests
                                    .OrderByDescending(r => r.Id)
                                    .Where(r => r.LeadId == f.LeadId)
                                    .Select(r => r.Notes)
                                    .FirstOrDefault() ?? "",
                })
                .ToListAsync();

            return Ok(favorites);
        }

        // POST: api/crm/favorites
        // إضافة عميل للمفضلة
        [HttpPost]
        public async Task<IActionResult> AddFavorite([FromBody] AddFavoriteDto dto)
        {
            // تجنب التكرار
            bool exists = await _context.LeadFavorites
                .AnyAsync(f => f.BrokerId == dto.BrokerId && f.LeadId == dto.LeadId);
            if (exists) return Ok(new { message = "Already in favorites." });

            var broker = await _context.Users.FindAsync(dto.BrokerId) as ApplicantUser;
            var brokerName = broker != null ? broker.FirstName + " " + broker.LastName : "Unknown";

            _context.LeadFavorites.Add(new LeadFavorite
            {
                BrokerId = dto.BrokerId,
                BrokerName = brokerName,
                LeadId = dto.LeadId,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Added to favorites." });
        }

        // DELETE: api/crm/favorites?brokerId=xxx&leadId=yyy
        // إزالة عميل من المفضلة
        [HttpDelete]
        public async Task<IActionResult> RemoveFavorite([FromQuery] string brokerId, [FromQuery] int leadId)
        {
            var fav = await _context.LeadFavorites
                .FirstOrDefaultAsync(f => f.BrokerId == brokerId && f.LeadId == leadId);

            if (fav == null) return NotFound();

            _context.LeadFavorites.Remove(fav);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Removed from favorites." });
        }
    }

    public class AddFavoriteDto
    {
        public string BrokerId { get; set; } = string.Empty;
        public int LeadId { get; set; }
    }
}