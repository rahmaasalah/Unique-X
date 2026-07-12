using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Unique_X.Data;
using Unique_X.DTOs;
using Unique_X.Models;

namespace Unique_X.Controllers
{
    [Route("api/visitlist")]
    [ApiController]
    [Authorize]
    public class VisitListController : ControllerBase
    {
        private readonly AppDbContext _context;
        public VisitListController(AppDbContext context) { _context = context; }

        [HttpPost("toggle/{propertyId}")]
        public async Task<IActionResult> Toggle(int propertyId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var existing = await _context.VisitLists
                .FirstOrDefaultAsync(v => v.UserId == userId && v.PropertyId == propertyId);

            if (existing != null)
            {
                _context.VisitLists.Remove(existing);
                await _context.SaveChangesAsync();
                return Ok(new { IsVisitListed = false });
            }

            await _context.VisitLists.AddAsync(new VisitList { UserId = userId, PropertyId = propertyId });
            await _context.SaveChangesAsync();
            return Ok(new { IsVisitListed = true });
        }

        [HttpGet]
        public async Task<IActionResult> GetMyVisitList()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var result = await _context.VisitLists
                .Where(v => v.UserId == userId)
                .Include(v => v.Property).ThenInclude(p => p.Photos)
                .Include(v => v.Property).ThenInclude(p => p.Broker)
                .Select(v => new PropertyResponseDto
                {
                    Id = v.Property.Id,
                    Title = v.Property.Title,
                    Price = v.Property.Price,
                    Area = v.Property.Area,
                    Rooms = v.Property.Rooms,
                    Bathrooms = v.Property.Bathrooms,
                    City = v.Property.City.ToString(),
                    ListingType = v.Property.ListingType.ToString(),
                    PropertyType = v.Property.PropertyType.ToString(),
                    Region = v.Property.Region,
                    CreatedAt = v.Property.CreatedAt,
                    Photos = v.Property.Photos.Select(ph => new PhotoResponseDto { Url = ph.Url, IsMain = ph.IsMain }).ToList(),
                    BrokerName = v.Property.Broker.FirstName + " " + v.Property.Broker.LastName,
                    BrokerPhone = v.Property.Broker.PhoneNumber,
                    IsVisitListed = true
                })
                .ToListAsync();

            return Ok(result);
        }
    }
}