using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;

namespace Unique_X.Controllers
{
    [Route("api/owner-properties")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class OwnerPropertiesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OwnerPropertiesController(AppDbContext context)
        {
            _context = context;
        }

        public class ApproveOwnerPropertyDto
        {
            public string BrokerId { get; set; }
        }

        public class RejectOwnerPropertyDto
        {
            public string Reason { get; set; }
        }

        // GET api/owner-properties
        // كل الوحدات اللي اتقدمت من زرار "Add Your Property" (Pending, Approved, أو Rejected)
        [HttpGet]
        public async Task<IActionResult> GetOwnerProperties()
        {
            var result = await _context.Properties
                .Include(p => p.Photos)
                .Where(p => p.IsOwnerSubmitted)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Id,
                    p.Title,
                    p.Code,
                    p.Price,
                    City = p.City.ToString(),
                    p.Region,
                    PropertyType = p.PropertyType.ToString(),
                    ListingType = p.ListingType.ToString(),
                    p.OwnerName,
                    p.OwnerPhone,
                    p.IsApproved,
                    p.IsActive,
                    p.RejectionReason,
                    p.CreatedAt,
                    MainPhotoUrl = p.Photos.Where(ph => ph.IsMain).Select(ph => ph.Url).FirstOrDefault()
                                   ?? p.Photos.Select(ph => ph.Url).FirstOrDefault()
                })
                .ToListAsync();

            return Ok(result);
        }

        // PATCH api/owner-properties/5/approve
        // الأدمن هنا لازم يختار البروكر اللي الوحدة هتتنسبله
        [HttpPatch("{id}/approve")]
        public async Task<IActionResult> Approve(int id, [FromBody] ApproveOwnerPropertyDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.BrokerId))
                return BadRequest("You must select a broker to approve this property.");

            var property = await _context.Properties.FindAsync(id);
            if (property == null) return NotFound("Property not found");

            var brokerExists = await _context.Users.AnyAsync(u => u.Id == dto.BrokerId);
            if (!brokerExists) return BadRequest("Selected broker does not exist.");

            property.BrokerId = dto.BrokerId;
            property.IsApproved = true;
            property.IsActive = true;
            property.RejectionReason = null;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Property approved and assigned to broker successfully." });
        }

        // PATCH api/owner-properties/5/reject
        [HttpPatch("{id}/reject")]
        public async Task<IActionResult> Reject(int id, [FromBody] RejectOwnerPropertyDto dto)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null) return NotFound("Property not found");

            property.IsApproved = false;
            property.IsActive = false;
            property.RejectionReason = dto?.Reason ?? "Rejected by admin";

            await _context.SaveChangesAsync();
            return Ok(new { message = "Property rejected." });
        }
    }
}