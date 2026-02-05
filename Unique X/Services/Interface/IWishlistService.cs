using Unique_X.DTOs;

namespace Unique_X.Services.Interface
{
    public interface IWishlistService
    {
        // دالة الـ Toggle (إضافة لو مش موجودة، وحذف لو موجودة)
        Task<bool> ToggleWishlistAsync(string userId, int propertyId);

        // جلب قائمة العقارات المفضلة للمستخدم
        Task<IEnumerable<PropertyResponseDto>> GetUserWishlistAsync(string userId);
    }
}
