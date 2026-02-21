using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Unique_X.Data;
using Unique_X.DTOs;
using Unique_X.Models;
using Unique_X.Services;
using Unique_X.Services.Implementation;
using Unique_X.Services.Interface;

namespace Unique_X.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly UserManager<ApplicantUser> _userManager; 
        private readonly AppDbContext _context;
        private readonly IPhotoService _photoService;

        public AuthController(
            IAuthService authService, 
            UserManager<ApplicantUser> userManager,
            AppDbContext context,
            IPhotoService photoService)
        {
            _authService = authService;
            _userManager = userManager;
            _context = context;
            _photoService = photoService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterAsync([FromBody] RegisterDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.RegisterAsync(model);

            if (!result.IsAuthenticated)
                return BadRequest(result.Message);

            return Ok(result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> LoginAsync([FromBody] LoginDto model)
        {
            // 1. البحث عن المستخدم أولاً قبل محاولة تسجيل الدخول
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                return BadRequest("Invalid Email or Password!");

            // 2. الفحص الجوهري: هل الحساب موقوف (Suspended)؟
            if (!user.IsActive)
            {
                return BadRequest("Your account has been suspended by the administrator.");
            }
            // 4. لو كل شيء تمام، كمل عملية اللوجين العادية
            var result = await _authService.LoginAsync(model);

            if (!result.IsAuthenticated)
                return BadRequest(result.Message);

            return Ok(result);
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null) return NotFound();

            var model = new UserProfileDto
            {
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                UserType = user.UserType,
                ProfileImageUrl = user.ProfileImageUrl,
                // حساب الإحصائيات سريعاً
                TotalProperties = _context.Properties.Count(p => p.BrokerId == userId),
                TotalWishlist = _context.Wishlists.Count(w => w.UserId == userId),
                Properties = _context.Properties
            .Where(p => p.BrokerId == userId)
            .Select(p => new UserPropertyInfo
            {
                Id = p.Id,
                Title = p.Title,
                PropertyType = p.PropertyType.ToString()
            }).ToList()
            };

            return Ok(model);
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UserProfileDto model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);

            user.FirstName = model.FirstName;
            user.LastName = model.LastName;
            user.PhoneNumber = model.PhoneNumber;

            var result = await _userManager.UpdateAsync(user);
            if (result.Succeeded) return Ok(new { Message = "Profile updated successfully" });

            return BadRequest(result.Errors);
        }

        [HttpPost("upload-profile-image")]
        [Authorize]
        public async Task<IActionResult> UploadProfileImage(IFormFile file)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            // 1. رفع الصورة لـ Cloudinary
            var result = await _photoService.AddPhotoAsync(file);
            if (result.Error != null) return BadRequest(result.Error.Message);

            // 2. تحديث بيانات اليوزر
            user.ProfileImageUrl = result.SecureUrl.AbsoluteUri;
            user.ProfileImagePublicId = result.PublicId;

            await _userManager.UpdateAsync(user);

            return Ok(new { url = user.ProfileImageUrl });
        }

        [HttpGet("brokers")]
        [AllowAnonymous] // الكل يقدر يشوف البروكرز
        public async Task<IActionResult> GetBrokers()
        {
            var brokers = await _userManager.Users
                .Where(u => u.UserType == 1 && u.IsActive) // البروكرز النشطين فقط
                .Select(u => new BrokerListDto
                {
                    Id = u.Id,
                    FullName = u.FirstName + " " + u.LastName,
                    ProfileImageUrl = u.ProfileImageUrl,
                    PropertiesCount = _context.Properties.Count(p => p.BrokerId == u.Id && !p.IsSold)
                }).ToListAsync();

            return Ok(brokers);
        }

        [HttpGet("admin-contact")]
        [AllowAnonymous] // مسموح للجميع لمعرفة رقم التواصل
        public async Task<IActionResult> GetAdminContact()
        {
            // البحث عن أول مستخدم يملك صلاحية Admin
            var admin = await _userManager.GetUsersInRoleAsync("Admin");
            var adminUser = admin.FirstOrDefault();

            if (adminUser == null) return NotFound();

            return Ok(new { PhoneNumber = adminUser.PhoneNumber });
        }

    }
}