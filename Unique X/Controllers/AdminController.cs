using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // تأكدي من وجود السطر ده
using System.Security.Claims;
using Unique_X.Data;
using Unique_X.DTOs;
using Unique_X.Models;
using Unique_X.Services.Implementation;
using Unique_X.Services.Interface;

namespace Unique_X.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<ApplicantUser> _userManager;
        private readonly AppDbContext _context;
        private readonly IPhotoService _photoService;

        public AdminController(UserManager<ApplicantUser> userManager, AppDbContext context, IPhotoService photoService)
        {
            _userManager = userManager;
            _context = context;
            _photoService = photoService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            // الآن ToListAsync ستعمل بدون أخطاء
            var users = await _userManager.Users.Select(u => new {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.UserType,
                u.IsActive,
                u.PhoneNumber
            }).ToListAsync();
            return Ok(users);
        }

        [HttpPatch("toggle-user/{id}")]
        public async Task<IActionResult> ToggleUserStatus(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();
            user.IsActive = !user.IsActive;
            await _userManager.UpdateAsync(user);
            return Ok(new { Status = user.IsActive });
        }
        [HttpPatch]
        public async Task<IActionResult> ReassignProperty(int propertyId, string newBrokerId)
        {
            // 1. البحث عن العقار
            var property = await _context.Properties.FindAsync(propertyId);
            if (property == null) return NotFound("Property not found");

            // 2. التحقق من أن المستخدم الجديد موجود وفعلاً UserType == 1 (بروكر)
            var newBroker = await _userManager.FindByIdAsync(newBrokerId);
            if (newBroker == null || newBroker.UserType != 1)
                return BadRequest("Invalid broker account");

            // 3. تغيير ملكية العقار
            property.BrokerId = newBrokerId;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Property reassigned successfully" });
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var stats = new
            {
                TotalUsers = await _userManager.Users.CountAsync(),
                TotalProperties = await _context.Properties.CountAsync(),
                SuspendedUsers = await _userManager.Users.CountAsync(u => !u.IsActive),
                SoldProperties = await _context.Properties.CountAsync(p => p.IsSold),
                InactiveProperties = await _context.Properties.CountAsync(p => !p.IsActive),
                TotalWhatsAppClicks = await _context.AnalyticsRecords.CountAsync(r => r.ActionType == "WhatsAppClick"),
                TotalCallClicks = await _context.AnalyticsRecords.CountAsync(r => r.ActionType == "CallClick")
            };
            return Ok(stats);
        }

        //[HttpGet("properties")]
        [HttpGet("properties-detailed")]
        public async Task<IActionResult> GetAllPropertiesDetailed()
        {
            var props = await _context.Properties
                .Include(p => p.Broker)
                .Include(p => p.Photos)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return Ok(props); 
        }

        [HttpPatch("toggle-property/{id}")]
        public async Task<IActionResult> TogglePropertyStatus(int id)
        {
            var prop = await _context.Properties.FindAsync(id);
            if (prop == null) return NotFound();
            prop.IsActive = !prop.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { Status = prop.IsActive });
        }

        [HttpPost("add-banner")]
        public async Task<IActionResult> AddBanner([FromForm] BannerUploadDto dto) // تعديل هنا
        {
            // استخدام dto.File و dto.Title
            var result = await _photoService.AddPhotoAsync(dto.File);
            if (result.Error != null) return BadRequest(result.Error.Message);

            var banner = new HomeBanner
            {
                ImageUrl = result.SecureUrl.AbsoluteUri,
                PublicId = result.PublicId,
                MessageTitle = dto.Title
            };

            _context.HomeBanners.Add(banner);
            await _context.SaveChangesAsync();
            return Ok(banner);
        }

        [HttpDelete("delete-banner/{id}")]
        public async Task<IActionResult> DeleteBanner(int id)
        {
            var banner = await _context.HomeBanners.FindAsync(id);
            if (banner == null) return NotFound();

            await _photoService.DeletePhotoAsync(banner.PublicId);
            _context.HomeBanners.Remove(banner);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Deleted" });
        }

        [HttpGet("banners")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBanners()
        {
            var banners = await _context.HomeBanners.ToListAsync();
            return Ok(banners ?? new List<HomeBanner>());
        }

        [HttpPost("track")]
        [AllowAnonymous] 
        public async Task<IActionResult> TrackAction(string action, int? propertyId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var record = new AnalyticsRecord
            {
                ActionType = action,
                PropertyId = propertyId,
                UserId = userId
            };

            _context.AnalyticsRecords.Add(record);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("properties-sold")]
        public async Task<IActionResult> GetSoldProperties()
        {
            var props = await _context.Properties
                .Include(p => p.Broker)
                .Where(p => p.IsSold)
                .Select(p => new {
                    p.Id,
                    p.Title,
                    p.Code,
                    p.PropertyType,
                    BrokerName = p.Broker.FirstName + " " + p.Broker.LastName
                }).ToListAsync();
            return Ok(props);
        }

        [HttpGet("activity-logs/{type}")]
        public async Task<IActionResult> GetActivityLogs(string type)
        {
            var logs = await _context.AnalyticsRecords
                .Where(r => r.ActionType == type)
                .OrderByDescending(r => r.Timestamp)
                .Select(r => new {
                    r.Timestamp,
                    UserWhoClicked = _context.Users.Where(u => u.Id == r.UserId)
                                     .Select(u => u.FirstName + " " + u.LastName + " (" + u.PhoneNumber + ")")
                                     .FirstOrDefault() ?? "Guest User",
                    Property = _context.Properties.Where(p => p.Id == r.PropertyId)
                               .Select(p => new { p.Title, p.Code, p.PropertyType,
                                   BrokerFullName = p.Broker.FirstName + " " + p.Broker.LastName
                               }).FirstOrDefault()
                }).ToListAsync();

            return Ok(logs);
        }

        [HttpGet("suspended-users")]
        public async Task<IActionResult> GetSuspendedUsers()
        {
            var users = await _userManager.Users
                .Where(u => !u.IsActive)
                .Select(u => new {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.UserType,
                    u.IsActive,
                    u.PhoneNumber,
                    u.ProfileImageUrl
                }).ToListAsync();
            return Ok(users);
        }

        [HttpGet("suspended-properties")]
        public async Task<IActionResult> GetSuspendedProperties()
        {
            var props = await _context.Properties
                .Include(p => p.Broker)
                .Where(p => !p.IsActive)
                .Select(p => new {
                    p.Id,
                    p.Title,
                    p.Code,
                    p.Price,
                    p.IsActive,
                    p.IsSold,
                    BrokerName = p.Broker.FirstName + " " + p.Broker.LastName,
                    Photos = p.Photos.Select(img => new { img.Url }).ToList()
                }).ToListAsync();
            return Ok(props);
        }
    }
}