using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Unique_X.Data;
using Unique_X.DTOs;
using Unique_X.Models;

namespace Unique_X.Controllers
{
    [Route("api/properties/{propertyId}/reviews")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReviewsController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/properties/5/reviews
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetReviews(int propertyId)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = User.IsInRole("Admin");

            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.PropertyId == propertyId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var result = reviews.Select(r => new ReviewResponseDto
            {
                Id = r.Id,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                UserName = $"{r.User?.FirstName} {r.User?.LastName}".Trim(),
                UserType = (r.User != null && r.User.UserType == 1) ? "Broker" : "Client",
                UserImage = r.User?.ProfileImageUrl,
                IsOwn = currentUserId != null && r.UserId == currentUserId,
                CanDelete = isAdmin || (currentUserId != null && r.UserId == currentUserId)
            });

            return Ok(result);
        }

        // POST /api/properties/5/reviews
        // لو اليوزر عمل ريفيو قبل كده على نفس الوحدة، بيتحدث بدل ما يتكرر
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddReview(int propertyId, [FromBody] AddReviewDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var propertyExists = await _context.Properties.AnyAsync(p => p.Id == propertyId);
            if (!propertyExists) return NotFound("Property not found");

            var existing = await _context.Reviews
                .FirstOrDefaultAsync(r => r.PropertyId == propertyId && r.UserId == userId);

            if (existing != null)
            {
                existing.Rating = dto.Rating;
                existing.Comment = dto.Comment;
                existing.CreatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.Reviews.Add(new Review
                {
                    PropertyId = propertyId,
                    UserId = userId,
                    Rating = dto.Rating,
                    Comment = dto.Comment,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Review saved successfully" });
        }

        // DELETE /api/properties/5/reviews/12
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(int propertyId, int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = User.IsInRole("Admin");

            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == id && r.PropertyId == propertyId);

            if (review == null) return NotFound();
            if (review.UserId != userId && !isAdmin) return Forbid();

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Review deleted" });
        }
    }
}