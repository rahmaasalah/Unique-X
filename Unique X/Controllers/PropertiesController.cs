using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Unique_X.DTOs;
using Unique_X.Services;
using Unique_X.Services.Interface;

namespace Unique_X.Controllers
{
    [Route("api/properties")]
    [ApiController]
    public class PropertiesController : ControllerBase
    {
        private readonly IPropertiesService _propertiesService;

        public PropertiesController(IPropertiesService propertiesService)
        {
            _propertiesService = propertiesService;
        }


        [HttpPost("add")]
        [Authorize]
        [DisableRequestSizeLimit]
        public async Task<IActionResult> AddProperty([FromForm] PropertyFormDto dto)
        {
            // استخراج الـ ID الخاص بالبروكر من التوكن
            var brokerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (brokerId == null)
                return Unauthorized();
            if (dto.Photos == null || dto.Photos.Count == 0)
            {
                return BadRequest("Photos must be uploded");
            }

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _propertiesService.AddPropertyAsync(dto, brokerId);

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] PropertyFilterDto filter)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var result = await _propertiesService.GetAllPropertiesAsync(filter, userId);

            if (result == null || !result.Any())
            {
                string message = "There are no properties that match your selections at the moment.";

                if (filter.City.HasValue)
                {
                    var cityName = Enum.GetName(typeof(Unique_X.Models.PropEnums.City), filter.City.Value);
                    message = $"There are no properties in {cityName}.";
                }
                else if (filter.MinPrice.HasValue || filter.MaxPrice.HasValue)
                {
                    message = "There are no properties in the requested price range.";
                }

                return Ok(new { Message = message, Data = result });
            }

            return Ok(result);
        }

        [HttpGet("my-properties")]
        [Authorize]
        public async Task<IActionResult> GetMyProperties()
        {
            var brokerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (brokerId == null) return Unauthorized();

            var result = await _propertiesService.GetBrokerPropertiesAsync(brokerId);
            return Ok(result);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateProperty(int id, [FromForm] UpdatePropertyDto dto)
        {
            var brokerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var result = await _propertiesService.UpdatePropertyAsync(id, dto, brokerId);

            if (result == null)
                return NotFound("Can't update this property");

            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteProperty(int id)
        {
            var brokerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var deleted = await _propertiesService.DeletePropertyAsync(id, brokerId);

            if (!deleted)
                return BadRequest("Failed to delete property");

            return Ok("Deleted Successfully");
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _propertiesService.GetPropertyByIdAsync(id);
            return result != null ? Ok(result) : NotFound();
        }
    }
}