using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Unique_X.Data;
using Unique_X.DTOs;
using Unique_X.Models;

namespace Unique_X.Controllers
{
    [Route("api/shortlist")]
    [ApiController]
    [Authorize]
    public class ShortlistController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ShortlistController(AppDbContext context) { _context = context; }

        [HttpPost("toggle/{propertyId}")]
        public async Task<IActionResult> Toggle(int propertyId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var existing = await _context.Shortlists
                .FirstOrDefaultAsync(s => s.UserId == userId && s.PropertyId == propertyId);

            if (existing != null)
            {
                _context.Shortlists.Remove(existing);
                await _context.SaveChangesAsync();
                return Ok(new { IsShortlisted = false });
            }

            await _context.Shortlists.AddAsync(new Shortlist { UserId = userId, PropertyId = propertyId });
            await _context.SaveChangesAsync();
            return Ok(new { IsShortlisted = true });
        }

        [HttpGet]
        public async Task<IActionResult> GetMyShortlist()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var result = await _context.Shortlists
                .Where(s => s.UserId == userId)
                .Include(s => s.Property).ThenInclude(p => p.Photos)
                .Include(s => s.Property).ThenInclude(p => p.Broker)
                .Select(s => new PropertyResponseDto
                {
                    Id = s.Property.Id,
                    Title = s.Property.Title,
                    Price = s.Property.Price,
                    Area = s.Property.Area,
                    Rooms = s.Property.Rooms,
                    Bathrooms = s.Property.Bathrooms,
                    City = s.Property.City.ToString(),
                    ListingType = s.Property.ListingType.ToString(),
                    PropertyType = s.Property.PropertyType.ToString(),
                    Region = s.Property.Region,
                    CreatedAt = s.Property.CreatedAt,
                    Photos = s.Property.Photos.Select(ph => new PhotoResponseDto { Url = ph.Url, IsMain = ph.IsMain }).ToList(),
                    BrokerName = s.Property.Broker.FirstName + " " + s.Property.Broker.LastName,
                    BrokerPhone = s.Property.Broker.PhoneNumber,
                    IsShortlisted = true
                })
                .ToListAsync();

            return Ok(result);
        }
    }
}