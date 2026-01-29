using CloudinaryDotNet.Actions;

namespace Unique_X.Services.Interface
{
    public interface IPhotoService
    {
        // دالة الرفع
        Task<ImageUploadResult> AddPhotoAsync(IFormFile file);

        // دالة الحذف
        Task<DeletionResult> DeletePhotoAsync(string publicId);
    }
}
