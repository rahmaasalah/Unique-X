using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs;
using Unique_X.Helpers;
using Unique_X.Models;
using Unique_X.Models.Authorization;
using Unique_X.Services.Interface;

namespace Unique_X.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AuthorizationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicantUser> _userManager;
        private readonly IPermissionService _permissionService;

        public AuthorizationController(AppDbContext context, UserManager<ApplicantUser> userManager, IPermissionService permissionService)
        {
            _context = context;
            _userManager = userManager;
            _permissionService = permissionService;
        }

        private string CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

        // 🟢 قائمة الصلاحيات الممكنة لتاب "Authorization" في الفرونت (الـ checkboxes)
        // GET: api/authorization/catalog?dashboard=Admin
        [HttpGet("catalog")]
        [Authorize(Roles = "Admin")]
        public IActionResult GetCatalog([FromQuery] string dashboard = "Admin")
        {
            var list = dashboard == PermissionCatalog.DashboardCrm
                ? PermissionCatalog.CrmPermissions
                : PermissionCatalog.AdminPermissions;

            return Ok(list.Select(p => new PermissionCatalogItemDto { Key = p.Key, Label = p.Label }));
        }

        // 🟢 نفس بيانات AdminController.GetAllUsers بالظبط، بس متاحة لأي يوزر مسجل دخول (مش محتاجة صلاحية admin-dashboard)
        // بنستخدمها في CRM dashboard عشان قائمة البروكرز (Transfer Leads, VIP Brokers...إلخ)
        // بدل ما نعتمد على endpoint الأدمن اللي بقى محمي بصلاحيات admin-dashboard دلوقتي
        // GET: api/authorization/crm-users-data
        [HttpGet("crm-users-data")]
        public async Task<IActionResult> GetCrmUsersData()
        {
            var users = await _userManager.Users.Select(u => new {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.UserType,
                u.IsActive,
                u.PhoneNumber,
                u.HasCrmAccess,
                u.CreatedAt,
                u.LeadLimit
            }).ToListAsync();

            return Ok(users);
        }

        // 🟢 قائمة البروكرز عشان الأدمن يختار مين صاحب الرول (نفس فكرة brokers-with-codes بس هنا للـ Authorization tab)
        // GET: api/authorization/brokers
        [HttpGet("brokers")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetBrokers()
        {
            var brokers = await _userManager.Users
                .Where(u => u.IsActive)
                .OrderBy(u => u.FirstName)
                .Select(u => new CustomRoleMemberDto
                {
                    UserId = u.Id,
                    FullName = (u.FirstName ?? "") + " " + (u.LastName ?? ""),
                    BrokerCode = u.BrokerCode,
                    PhoneNumber = u.PhoneNumber
                })
                .ToListAsync();

            return Ok(brokers);
        }

        // GET: api/authorization/roles?dashboard=Admin
        [HttpGet("roles")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRoles([FromQuery] string dashboard = "Admin")
        {
            var roles = await _context.CustomRoles
                .Where(r => r.Dashboard == dashboard)
                .Include(r => r.Permissions)
                .Include(r => r.Members).ThenInclude(m => m.User)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var result = roles.Select(r => new CustomRoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Dashboard = r.Dashboard,
                Description = r.Description,
                CreatedAt = r.CreatedAt,
                Permissions = r.Permissions.Select(p => p.PermissionKey).ToList(),
                Members = r.Members.Select(m => new CustomRoleMemberDto
                {
                    UserId = m.UserId,
                    FullName = (m.User.FirstName ?? "") + " " + (m.User.LastName ?? ""),
                    BrokerCode = m.User.BrokerCode,
                    PhoneNumber = m.User.PhoneNumber
                }).ToList()
            });

            return Ok(result);
        }

        // POST: api/authorization/roles
        [HttpPost("roles")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateRole([FromBody] SaveCustomRoleDto dto)
        {
            var (isValid, error) = await ValidateDto(dto, existingRoleId: null);
            if (!isValid) return BadRequest(error);

            var role = new CustomRole
            {
                Name = dto.Name.Trim(),
                Dashboard = dto.Dashboard,
                Description = dto.Description,
                CreatedByUserId = CurrentUserId,
                CreatedAt = DateTime.UtcNow,
                Permissions = dto.PermissionKeys.Distinct()
                    .Select(k => new CustomRolePermission { PermissionKey = k }).ToList(),
                Members = dto.MemberUserIds.Distinct()
                    .Select(id => new CustomRoleMember { UserId = id }).ToList()
            };

            _context.CustomRoles.Add(role);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Role created successfully", id = role.Id });
        }

        // PUT: api/authorization/roles/{id}
        [HttpPut("roles/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] SaveCustomRoleDto dto)
        {
            var role = await _context.CustomRoles
                .Include(r => r.Permissions)
                .Include(r => r.Members)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null) return NotFound("Role not found");

            var (isValid, error) = await ValidateDto(dto, existingRoleId: id);
            if (!isValid) return BadRequest(error);

            role.Name = dto.Name.Trim();
            role.Description = dto.Description;
            role.UpdatedAt = DateTime.UtcNow;

            _context.CustomRolePermissions.RemoveRange(role.Permissions);
            _context.CustomRoleMembers.RemoveRange(role.Members);

            role.Permissions = dto.PermissionKeys.Distinct()
                .Select(k => new CustomRolePermission { PermissionKey = k, CustomRoleId = role.Id }).ToList();
            role.Members = dto.MemberUserIds.Distinct()
                .Select(uid => new CustomRoleMember { UserId = uid, CustomRoleId = role.Id }).ToList();

            await _context.SaveChangesAsync();

            return Ok(new { message = "Role updated successfully" });
        }

        // DELETE: api/authorization/roles/{id}
        [HttpDelete("roles/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var role = await _context.CustomRoles.FindAsync(id);
            if (role == null) return NotFound("Role not found");

            _context.CustomRoles.Remove(role); // Cascade هتشيل الـ Permissions والـ Members تبعه
            await _context.SaveChangesAsync();

            return Ok(new { message = "Role deleted successfully" });
        }

        // 🟢 بيرجع صلاحيات اليوزر الحالي (المسجل دخول) - ده اللي بتستخدمه صفحة profile/broker-profile
        // وكمان بتستخدمه admin-dashboard/crm-dashboard نفسهم عشان يفلتروا التابات المعروضة في الـ sidebar
        // GET: api/authorization/my-permissions
        [HttpGet("my-permissions")]
        public async Task<IActionResult> GetMyPermissions()
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            var isFullAdmin = await _permissionService.IsFullAdminAsync(userId);

            var adminKeys = await _permissionService.GetUserPermissionKeysAsync(userId, PermissionCatalog.DashboardAdmin);
            var crmKeys = await _permissionService.GetUserPermissionKeysAsync(userId, PermissionCatalog.DashboardCrm);

            var adminRoleNames = await _context.CustomRoleMembers
                .Where(m => m.UserId == userId && m.CustomRole.Dashboard == PermissionCatalog.DashboardAdmin)
                .Select(m => m.CustomRole.Name).Distinct().ToListAsync();

            var crmRoleNames = await _context.CustomRoleMembers
                .Where(m => m.UserId == userId && m.CustomRole.Dashboard == PermissionCatalog.DashboardCrm)
                .Select(m => m.CustomRole.Name).Distinct().ToListAsync();

            return Ok(new MyPermissionsDto
            {
                IsFullAdmin = isFullAdmin,
                HasCrmAccess = user.HasCrmAccess || isFullAdmin,
                AdminPermissions = adminKeys,
                CrmPermissions = crmKeys,
                AdminRoleNames = adminRoleNames,
                CrmRoleNames = crmRoleNames
            });
        }

        private async Task<(bool isValid, string error)> ValidateDto(SaveCustomRoleDto dto, int? existingRoleId)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return (false, "Role name is required.");

            if (dto.Dashboard != PermissionCatalog.DashboardAdmin && dto.Dashboard != PermissionCatalog.DashboardCrm)
                return (false, "Dashboard must be 'Admin' or 'Crm'.");

            if (dto.PermissionKeys == null || !dto.PermissionKeys.Any())
                return (false, "At least one permission must be selected.");

            var invalidKeys = dto.PermissionKeys.Where(k => !PermissionCatalog.IsValidKey(dto.Dashboard, k)).ToList();
            if (invalidKeys.Any())
                return (false, $"Invalid permission keys: {string.Join(", ", invalidKeys)}");

            if (dto.MemberUserIds == null || !dto.MemberUserIds.Any())
                return (false, "At least one broker must be assigned to the role.");

            foreach (var uid in dto.MemberUserIds)
            {
                var exists = await _userManager.Users.AnyAsync(u => u.Id == uid);
                if (!exists) return (false, $"Broker with id '{uid}' not found.");
            }

            var nameExists = await _context.CustomRoles.AnyAsync(r =>
                r.Dashboard == dto.Dashboard &&
                r.Name.ToLower() == dto.Name.Trim().ToLower() &&
                (existingRoleId == null || r.Id != existingRoleId));

            if (nameExists)
                return (false, "A role with this name already exists in this dashboard.");

            return (true, string.Empty);
        }
    }
}