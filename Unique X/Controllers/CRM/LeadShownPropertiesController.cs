using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs.CRM;
using Unique_X.Models;

namespace Unique_X.Controllers.CRM
{
    // 🟢 الوحدات اللي اتعرضت على العميل + رأي العميل فيها
    [Route("api/crm/leads/{leadId}/shown-properties")]
    [ApiController]
    public class LeadShownPropertiesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeadShownPropertiesController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/crm/leads/5/shown-properties
        [HttpGet]
        public async Task<IActionResult> GetShown(int leadId)
        {
            var rows = await _context.LeadShownProperties
                .AsNoTracking()
                .Where(s => s.LeadId == leadId)
                .Include(s => s.Property)
                .OrderByDescending(s => s.ShownAt)
                .ToListAsync();

            var reviewIds = rows.Where(r => r.ReviewId.HasValue).Select(r => r.ReviewId!.Value).ToList();
            var reviews = await _context.Reviews
                .AsNoTracking()
                .Where(r => reviewIds.Contains(r.Id))
                .ToDictionaryAsync(r => r.Id);

            var result = rows.Select(s =>
            {
                reviews.TryGetValue(s.ReviewId ?? 0, out var review);
                return new
                {
                    s.Id,
                    PropertyId = s.PropertyId,
                    Code = s.Property.Code ?? ("PROP-" + s.PropertyId),
                    Title = s.Property.Title,
                    s.Property.Price,
                    ShownAt = s.ShownAt,
                    Feedback = review == null ? null : new
                    {
                        review.Rating,
                        review.Comment,
                        review.CreatedAt
                    }
                };
            });

            return Ok(result);
        }

        // POST api/crm/leads/5/shown-properties/12?brokerId=xxx
        // البروكر أكد إنه عرض الوحدة دي على العميل. لو اتسجلت قبل كده مبتتكررش
        [HttpPost("{propertyId}")]
        public async Task<IActionResult> MarkShown(int leadId, int propertyId, [FromQuery] string? brokerId)
        {
            var leadExists = await _context.Leads.AnyAsync(l => l.Id == leadId);
            if (!leadExists) return NotFound("Lead not found");

            var propertyExists = await _context.Properties.AnyAsync(p => p.Id == propertyId);
            if (!propertyExists) return NotFound("Property not found");

            await EnsureShownAsync(leadId, propertyId, brokerId);
            return Ok(new { message = "Property marked as shown to the client." });
        }

        // POST api/crm/leads/5/shown-properties/12/feedback
        // رأي العميل في الوحدة، بيتسجل كـ Review على الوحدة وبيظهر في الـ Reviews بتاعتها
        [HttpPost("{propertyId}/feedback")]
        public async Task<IActionResult> AddFeedback(int leadId, int propertyId, [FromBody] AddShownFeedbackDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var lead = await _context.Leads.FirstOrDefaultAsync(l => l.Id == leadId);
            if (lead == null) return NotFound("Lead not found");

            var propertyExists = await _context.Properties.AnyAsync(p => p.Id == propertyId);
            if (!propertyExists) return NotFound("Property not found");

            var reviewerId = !string.IsNullOrWhiteSpace(dto.BrokerId) ? dto.BrokerId : lead.BrokerId;
            if (string.IsNullOrWhiteSpace(reviewerId) || !await _context.Users.AnyAsync(u => u.Id == reviewerId))
                return BadRequest("Broker not found.");

            var shown = await EnsureShownAsync(leadId, propertyId, reviewerId);

            Review? review = null;
            if (shown.ReviewId.HasValue)
                review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == shown.ReviewId.Value);

            if (review == null)
            {
                review = new Review
                {
                    PropertyId = propertyId,
                    UserId = reviewerId,
                    LeadId = leadId,
                    Rating = dto.Rating,
                    Comment = dto.Comment.Trim(),
                    CreatedAt = DateTime.UtcNow
                };
                _context.Reviews.Add(review);
                await _context.SaveChangesAsync();
                shown.ReviewId = review.Id;
            }
            else
            {
                review.Rating = dto.Rating;
                review.Comment = dto.Comment.Trim();
                review.CreatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Feedback saved." });
        }

        private async Task<LeadShownProperty> EnsureShownAsync(int leadId, int propertyId, string? brokerId)
        {
            var shown = await _context.LeadShownProperties
                .FirstOrDefaultAsync(s => s.LeadId == leadId && s.PropertyId == propertyId);

            if (shown == null)
            {
                shown = new LeadShownProperty
                {
                    LeadId = leadId,
                    PropertyId = propertyId,
                    ShownByBrokerId = brokerId,
                    ShownAt = DateTime.UtcNow
                };
                _context.LeadShownProperties.Add(shown);

                // نفس تسجيل الـ Proposed القديم عشان الكود الأخضر يفضل شغال
                var request = await _context.LeadRequests.FirstOrDefaultAsync(r => r.LeadId == leadId);
                if (request != null)
                {
                    var ids = string.IsNullOrEmpty(request.ProposedPropertyIds)
                        ? new List<string>()
                        : request.ProposedPropertyIds.Split(',').ToList();
                    if (!ids.Contains(propertyId.ToString()))
                    {
                        ids.Add(propertyId.ToString());
                        request.ProposedPropertyIds = string.Join(",", ids);
                    }
                }

                await _context.SaveChangesAsync();
            }

            return shown;
        }
    }
}