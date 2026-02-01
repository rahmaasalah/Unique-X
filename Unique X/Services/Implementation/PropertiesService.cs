using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs;
using Unique_X.Models;
using Unique_X.Services.Interface;
using static Unique_X.Models.PropEnums;

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

        // 1. إضافة عقار جديد
        public async Task<PropertyResponseDto> AddPropertyAsync(PropertyFormDto dto, string brokerId)
        {
            var property = new Property
            {
                Title = dto.Title ?? string.Empty,
                Description = dto.Description ?? string.Empty,
                Price = dto.Price ?? 0,
                Area = dto.Area ?? 0,
                Rooms = dto.Rooms ?? 0,
                Bathrooms = dto.Bathrooms ?? 0,
                City = (City)(dto.City ?? 0),
                ListingType = (ListingType)(dto.ListingType ?? 0),
                PropertyType = (PropertyType)(dto.PropertyType ?? 0),

                Region = dto.Region ?? string.Empty,
                Address = dto.Address ?? string.Empty,
                BrokerId = brokerId,
                Photos = new List<Photo>()
            };

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
                            IsMain = property.Photos.Count == 0
                        });
                    }
                }
            }

            await _context.Properties.AddAsync(property);
            await _context.SaveChangesAsync();
            // نحتاج لعمل Reload للبيانات لجلب بيانات البروكر للرد
            await _context.Entry(property).Reference(p => p.Broker).LoadAsync();

            return MapToResponseDto(property);
        }

        public async Task<IEnumerable<PropertyResponseDto>> GetAllPropertiesAsync(PropertyFilterDto filter)
        {
            var query = _context.Properties
                .Include(p => p.Photos)
                .Include(p => p.Broker)
                .AsQueryable();

            if (filter.City.HasValue)
                query = query.Where(p => p.City == (City)filter.City.Value);

            if (filter.MinPrice.HasValue)
                query = query.Where(p => p.Price >= filter.MinPrice.Value);

            if (filter.MaxPrice.HasValue)
                query = query.Where(p => p.Price <= filter.MaxPrice.Value);

            if (filter.Rooms.HasValue)
                query = query.Where(p => p.Rooms == filter.Rooms.Value);

            if (filter.PropertyType.HasValue)
                query = query.Where(p => p.PropertyType == (PropertyType)filter.PropertyType.Value);

            var properties = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();

            return properties.Select(p => MapToResponseDto(p));
        }

        public async Task<IEnumerable<PropertyResponseDto>> GetBrokerPropertiesAsync(string brokerId)
        {
            var properties = await _context.Properties
                .Include(p => p.Photos)
                .Include(p => p.Broker)
                .Where(p => p.BrokerId == brokerId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return properties.Select(p => MapToResponseDto(p));
        }

        public async Task<PropertyResponseDto> GetPropertyByIdAsync(int id)
        {
            var property = await _context.Properties
                .Include(p => p.Photos)
                .Include(p => p.Broker)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (property == null) return null;

            return MapToResponseDto(property);
        }

        public async Task<PropertyResponseDto> UpdatePropertyAsync(int id, UpdatePropertyDto dto, string brokerId)
        {
            var property = await _context.Properties
                .Include(p => p.Photos)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (property == null || property.BrokerId != brokerId)
                return null;

            //if (!string.IsNullOrEmpty(dto.Title)) property.Title = dto.Title;
            //if (!string.IsNullOrEmpty(dto.Description)) property.Description = dto.Description;

            //if (dto.Price.HasValue && dto.Price > 0) property.Price = dto.Price.Value;
            //if (dto.Area.HasValue && dto.Area > 0) property.Area = dto.Area.Value;
            //if (dto.Rooms.HasValue && dto.Rooms > 0) property.Rooms = dto.Rooms.Value;
            //if (dto.Bathrooms.HasValue && dto.Bathrooms > 0) property.Bathrooms = dto.Bathrooms.Value;

            //if (dto.City.HasValue) property.City = (City)dto.City.Value;
            //if (dto.ListingType.HasValue) property.ListingType = (ListingType)dto.ListingType.Value;
            //if (dto.PropertyType.HasValue) property.PropertyType = (PropertyType)dto.PropertyType.Value;

            //if (!string.IsNullOrEmpty(dto.Region)) property.Region = dto.Region;
            //if (!string.IsNullOrEmpty(dto.Address)) property.Address = dto.Address;


            if (property == null || property.BrokerId != brokerId)
                return null;


            property.Title = !string.IsNullOrEmpty(dto.Title) && dto.Title != "string"
                                     ? dto.Title : property.Title;

            property.Description = !string.IsNullOrEmpty(dto.Description) && dto.Description != "string"
                                           ? dto.Description : property.Description;

            if (dto.Price.HasValue && dto.Price > 0)
                property.Price = dto.Price.Value;

            if (dto.Area.HasValue && dto.Area > 0)
                property.Area = dto.Area.Value;

            if (dto.Rooms.HasValue)
                property.Rooms = dto.Rooms.Value;

            if (dto.Bathrooms.HasValue)
                property.Bathrooms = dto.Bathrooms.Value;

            if (dto.City.HasValue)
                property.City = (City)dto.City.Value;

            if (dto.ListingType.HasValue)
                property.ListingType = (ListingType)dto.ListingType.Value;

            if (dto.PropertyType.HasValue)
                property.PropertyType = (PropertyType)dto.PropertyType.Value;

            property.Region = !string.IsNullOrEmpty(dto.Region) && dto.Region != "string"
                                      ? dto.Region : property.Region;

            property.Address = !string.IsNullOrEmpty(dto.Address) && dto.Address != "string"
                                       ? dto.Address : property.Address;



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
                            IsMain = false
                        });
                    }
                }
            }

            _context.Properties.Update(property);
            await _context.SaveChangesAsync();

            return MapToResponseDto(property);
        }

        public async Task<bool> DeletePropertyAsync(int id, string brokerId)
        {
            var property = await _context.Properties
                .Include(p => p.Photos)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (property == null || property.BrokerId != brokerId)
                return false;

            foreach (var photo in property.Photos)
            {
                await _photoService.DeletePhotoAsync(photo.PublicId);
            }

            _context.Properties.Remove(property);
            return await _context.SaveChangesAsync() > 0;
        }

        private PropertyResponseDto MapToResponseDto(Property property)
        {
            return new PropertyResponseDto
            {
                Id = property.Id,
                Title = property.Title,
                Description = property.Description,
                Price = property.Price,
                Area = property.Area,
                Rooms = property.Rooms,
                Bathrooms = property.Bathrooms,
                City = property.City.ToString(),
                ListingType = property.ListingType.ToString(),
                PropertyType = property.PropertyType.ToString(),
                Region = property.Region,
                Address = property.Address,
                CreatedAt = property.CreatedAt,
                Photos = property.Photos.Select(p => new PhotoResponseDto
                {
                    Url = p.Url,
                    IsMain = p.IsMain
                }).ToList(),
                BrokerName = property.Broker != null ? property.Broker.FirstName + " " + property.Broker.LastName : "Unknown",
                BrokerPhone = property.Broker?.PhoneNumber ?? "N/A"
            };
        }
    }
}