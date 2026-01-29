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
        [Authorize] // يجب أن يكون مسجلاً للدخول
        [DisableRequestSizeLimit]
        public async Task<IActionResult> AddProperty([FromForm] PropertyFormDto dto)
        {
            // استخراج الـ ID الخاص بالبروكر من التوكن
            var brokerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            //string brokerId = "test-id";

            if (brokerId == null)
                return Unauthorized();
            if (dto.Photos == null || dto.Photos.Count == 0)
            {
                // يمكنك إرجاع رسالة خطأ هنا لو الصور مطلوبة
                return BadRequest("يجب رفع صور للعقار");
            }

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _propertiesService.AddPropertyAsync(dto, brokerId);

            return Ok(result);
        }
        [HttpGet("test")]
        [AllowAnonymous] // يسمح بالدخول بدون توكن للتجربة
        public IActionResult TestConnection()
        {
            return Ok("الكنترولر شغال وزي الفل! 🚀");
        }
    }
}