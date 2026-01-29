using Unique_X.Data;
using Unique_X.DTOs;
using Unique_X.Models;
using Unique_X.Services.Interface;

namespace Unique_X.Services.Implementation
{
    public class PropertiesService : IPropertiesService
    {
        private readonly AppDbContext _context;
        private readonly IPhotoService _photoService;

        public PropertiesService(AppDbContext context, IPhotoService photoService)
        {
            _context = context;
            _photoService = photoService;
        }

        public async Task<Property> AddPropertyAsync(PropertyFormDto dto, string brokerId)
        {
            // 1. تحويل البيانات (Mapping)
            var property = new Property
            {
                Title = dto.Title,
                Description = dto.Description,
                Price = dto.Price,
                Area = dto.Area,
                Rooms = dto.Rooms,
                Bathrooms = dto.Bathrooms,
                City = dto.City,
                Region = dto.Region,
                Address = dto.Address,
                ListingType = dto.ListingType,
                PropertyType = dto.PropertyType,
                BrokerId = brokerId, // ربط العقار بالبروكر الحالي
                Photos = new List<Photo>()
            };

            // 2. رفع الصور (إذا وجدت)
            if (dto.Photos != null && dto.Photos.Count > 0)
            {
                foreach (var file in dto.Photos)
                {
                    var result = await _photoService.AddPhotoAsync(file);

                    if (result.Error == null)
                    {
                        property.Photos.Add(new Photo
                        {
                            Url = result.SecureUrl.AbsoluteUri,
                            PublicId = result.PublicId,
                            IsMain = property.Photos.Count == 0 // أول صورة تكون هي الرئيسية
                        });
                    }
                }
            }

            // 3. الحفظ في قاعدة البيانات
            await _context.Properties.AddAsync(property);
            await _context.SaveChangesAsync();

            return property;
        }
    }
}
