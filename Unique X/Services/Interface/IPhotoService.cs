using CloudinaryDotNet.Actions;

namespace Unique_X.Services.Interface
{
    public interface IPhotoService
    {
        // دالة الرفع
        Task<ImageUploadResult> AddPhotoAsync(IFormFile file);

        // دالة الحذف
        Task<DeletionResult> DeletePhotoAsync(string publicId);

        // 🟢 بترفع صورة/GIF أو فيديو (mp4/webm/mov) حسب نوع الملف، وترجع الرابط مباشرة
        // مستخدمة في بانرات الإعلانات اللي ممكن تكون صورة أو فيديو
        Task<string?> AddMediaAsync(IFormFile file);
    }
}