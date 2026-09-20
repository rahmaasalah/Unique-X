using System.Security.Claims;

namespace Unique_X.Services.Interface
{
    public interface IPermissionService
    {
        // بيرجع true لو اليوزر Admin كامل (Role = Admin) أو معاه صلاحية الـ key ده في الـ dashboard ده
        Task<bool> HasPermissionAsync(ClaimsPrincipal principal, string dashboard, string permissionKey);

        // بيرجع كل الـ permission keys اللي اليوزر ده معاه في الـ dashboard ده
        // (لو رجّع null معناها Full Admin - كل الصلاحيات)
        Task<List<string>?> GetUserPermissionKeysAsync(string userId, string dashboard);

        Task<bool> IsFullAdminAsync(string userId);
    }
}