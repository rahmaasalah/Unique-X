using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.Models;
using Unique_X.Services.Interface;

namespace Unique_X.Services.Implementation
{
    public class PermissionService : IPermissionService
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicantUser> _userManager;

        public PermissionService(AppDbContext context, UserManager<ApplicantUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<bool> IsFullAdminAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return false;
            return await _userManager.IsInRoleAsync(user, "Admin");
        }

        public async Task<List<string>?> GetUserPermissionKeysAsync(string userId, string dashboard)
        {
            if (string.IsNullOrEmpty(userId)) return new List<string>();

            if (await IsFullAdminAsync(userId))
                return null; // null = فُل أدمن، كل الصلاحيات متاحة

            var keys = await _context.CustomRoleMembers
                .Where(m => m.UserId == userId && m.CustomRole.Dashboard == dashboard)
                .SelectMany(m => m.CustomRole.Permissions.Select(p => p.PermissionKey))
                .Distinct()
                .ToListAsync();

            return keys;
        }

        public async Task<bool> HasPermissionAsync(ClaimsPrincipal principal, string dashboard, string permissionKey)
        {
            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return false;

            var keys = await GetUserPermissionKeysAsync(userId, dashboard);
            if (keys == null) return true; // Full Admin

            return keys.Contains(permissionKey);
        }
    }
}