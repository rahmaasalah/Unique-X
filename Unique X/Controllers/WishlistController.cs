using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Unique_X.Services.Interface;

namespace Unique_X.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] 
    public class WishlistController : ControllerBase
    {
        private readonly IWishlistService _wishlistService;

        public WishlistController(IWishlistService wishlistService)
        {
            _wishlistService = wishlistService;
        }

        [HttpPost("toggle/{propertyId}")]
        public async Task<IActionResult> ToggleWishlist(int propertyId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var isAdded = await _wishlistService.ToggleWishlistAsync(userId, propertyId);

            return Ok(new
            {
                Message = isAdded ? "Added to wishlist" : "Removed from wishlist",
                IsFavorite = isAdded
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetMyWishlist()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var result = await _wishlistService.GetUserWishlistAsync(userId);
            return Ok(result);
        }
    }
}