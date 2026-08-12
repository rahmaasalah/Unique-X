using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using Unique_X.Helpers;
using Unique_X.Services.Interface;

namespace Unique_X.Services.Implementation
{
    public class PhotoService : IPhotoService
    {
        private readonly Cloudinary _cloudinary;

        public PhotoService(IOptions<CloudinarySettings> config)
        {
            var acc = new Account(
                config.Value.CloudName,
                config.Value.ApiKey,
                config.Value.ApiSecret
            );

            _cloudinary = new Cloudinary(acc);
        }

        public async Task<ImageUploadResult> AddPhotoAsync(IFormFile file)
        {
            var uploadResult = new ImageUploadResult();

            if (file.Length > 0)
            {
                try
                {
                    using var stream = file.OpenReadStream();

                    var isGif = file.ContentType == "image/gif" ||
                                file.FileName.EndsWith(".gif", StringComparison.OrdinalIgnoreCase);

                    var uploadParams = new ImageUploadParams
                    {
                        File = new FileDescription(file.FileName, stream),
                        // GIF: مفيش transformation خالص عشان يتحمل كما هو
                        // صور عادية: بتتضغط لـ 1200px
                        Transformation = isGif ? null : new Transformation().Width(1200).Crop("limit")
                    };

                    uploadResult = await _cloudinary.UploadAsync(uploadParams);
                }
                catch (Exception ex)
                {
                    uploadResult.Error = new Error { Message = "Error during uploading photos: " + ex.Message };
                }
            }

            return uploadResult;
        }

        public async Task<DeletionResult> DeletePhotoAsync(string publicId)
        {
            var deleteParams = new DeletionParams(publicId);
            return await _cloudinary.DestroyAsync(deleteParams);
        }

        // 🟢 لبانرات الإعلانات: بيكتشف نوع الملف ويرفعه بالطريقة المناسبة (صورة/GIF عادي، أو فيديو)
        public async Task<string?> AddMediaAsync(IFormFile file)
        {
            if (file == null || file.Length == 0) return null;

            var isVideo = file.ContentType.StartsWith("video/") ||
                          file.FileName.EndsWith(".mp4", StringComparison.OrdinalIgnoreCase) ||
                          file.FileName.EndsWith(".webm", StringComparison.OrdinalIgnoreCase) ||
                          file.FileName.EndsWith(".mov", StringComparison.OrdinalIgnoreCase);

            if (isVideo)
            {
                try
                {
                    using var stream = file.OpenReadStream();
                    var uploadParams = new VideoUploadParams
                    {
                        File = new FileDescription(file.FileName, stream)
                    };
                    var result = await _cloudinary.UploadAsync(uploadParams);
                    return result.Error == null ? result.SecureUrl?.AbsoluteUri : null;
                }
                catch
                {
                    return null;
                }
            }

            // صورة أو GIF: بنستخدم نفس دالة رفع الصور الموجودة أصلاً
            var imageResult = await AddPhotoAsync(file);
            return imageResult.Error == null ? imageResult.SecureUrl?.AbsoluteUri : null;
        }
    }
}