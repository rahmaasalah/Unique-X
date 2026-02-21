using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // تأكدي من وجود السطر ده
using Unique_X.Data;
using Unique_X.Models;

namespace Unique_X.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<ApplicantUser> _userManager;
        private readonly AppDbContext _context;

        public AdminController(UserManager<ApplicantUser> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
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

        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var stats = new
            {
                TotalUsers = await _userManager.Users.CountAsync(),
                TotalProperties = await _context.Properties.CountAsync(),
                SuspendedUsers = await _userManager.Users.CountAsync(u => !u.IsActive),
                SoldProperties = await _context.Properties.CountAsync(p => p.IsSold),
                InactiveProperties = await _context.Properties.CountAsync(p => !p.IsActive)
            };
            return Ok(stats);
        }

        [HttpGet("properties")]
        [HttpGet("properties-detailed")]
        public async Task<IActionResult> GetAllPropertiesDetailed()
        {
            // الأدمن محتاج يشوف "كل حاجة" عشان يحكم على العقار
            var props = await _context.Properties
                .Include(p => p.Broker)
                .Include(p => p.Photos)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return Ok(props); // هنبعت الـ Entities كاملة للأدمن
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
    }
}