using CloudinaryDotNet;
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
                DistanceFromLandmark = dto.DistanceFromLandmark,
                View = dto.View,
                BuildYear = dto.BuildYear ?? 2015,
                Floor = dto.Floor ?? 0,
                TotalFloors = dto.TotalFloors ?? 0,
                ApartmentsPerFloor = dto.ApartmentsPerFloor ?? 0,
                ElevatorsCount = dto.ElevatorsCount ?? 0,
                ReceptionPieces = dto.ReceptionPieces ?? 0,
                PaymentMethod = dto.PaymentMethod ?? "Cash", 
                InstallmentYears = dto.InstallmentYears ?? 0,
                HasBalcony = dto.HasBalcony ?? false,
                IsFurnished = dto.IsFurnished ?? false,

                HasMasterRoom = dto.HasMasterRoom ?? false,
                HasHotelEntrance = dto.HasHotelEntrance ?? false,
                HasSecurity = dto.HasSecurity ?? false,
                IsFirstOwner = dto.IsFirstOwner ?? false,
                IsLegalReconciled = dto.IsLegalReconciled ?? false,
                HasParking = dto.HasParking ?? false,
                CommissionPercentage = 2.5m, 
                Region = dto.Region ?? string.Empty,
                Address = dto.Address ?? string.Empty,
                BrokerId = brokerId,
                Photos = new List<Photo>()
            };

            if (dto.Photos != null && dto.Photos.Count > 0)
            {
                for (int i = 0; i < dto.Photos.Count; i++)
                {
                    var result = await _photoService.AddPhotoAsync(dto.Photos[i]);
                    if (result.Error == null)
                    {
                        property.Photos.Add(new Photo
                        {
                            Url = result.SecureUrl.AbsoluteUri,
                            PublicId = result.PublicId,
                            IsMain = (i == dto.MainPhotoIndex)
                        });
                    }
                }
            }

            await _context.Properties.AddAsync(property);
            await _context.SaveChangesAsync();
            await _context.Entry(property).Reference(p => p.Broker).LoadAsync();

            return MapToResponseDto(property);
        }

        public async Task<IEnumerable<PropertyResponseDto>> GetAllPropertiesAsync(PropertyFilterDto filter, string userId)
        {

            var userFavorites = new List<int>();
            if (!string.IsNullOrEmpty(userId))
            {
                userFavorites = await _context.Wishlists
                    .Where(w => w.UserId == userId)
                    .Select(w => w.PropertyId)
                    .ToListAsync();
            }

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

            if (!string.IsNullOrEmpty(filter.BrokerId))
                query = query.Where(p => p.BrokerId == filter.BrokerId);

            if (filter.ListingType.HasValue)
            {
                if (filter.ListingType.Value == 1)
                {
                    query = query.Where(p => p.ListingType == ListingType.Rent);
                }
                else
                {
                    
                    query = query.Where(p => p.ListingType != ListingType.Rent);
                }
            }
            query = query.Where(p => !p.IsSold);

            if (!string.IsNullOrEmpty(filter.SearchTerm))
            {
                var search = filter.SearchTerm.ToLower();

                query = query.Where(p =>
                    p.Title.ToLower().Contains(search) ||
                    p.Region.ToLower().Contains(search) ||
                    p.PropertyType.ToString().ToLower().Contains(search)
                );
            }

            var properties = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();

            return properties.Select(p => {
                var dto = MapToResponseDto(p);
                dto.IsFavorite = userFavorites.Contains(p.Id); 
                return dto;
            });
        }

        public async Task<bool> MarkAsSoldAsync(int id, string brokerId)
        {
            var property = await _context.Properties
                .FirstOrDefaultAsync(p => p.Id == id && p.BrokerId == brokerId);

            if (property == null) return false;

            property.IsSold = !property.IsSold;

            return await _context.SaveChangesAsync() > 0;
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
            // 1. جلب العقار أولاً
            var property = await _context.Properties
                .Include(p => p.Photos)
                .Include(p => p.Broker)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (property == null) return null;

            var count = await _context.Properties.CountAsync(p => p.BrokerId == property.BrokerId && !p.IsSold);

            var dto = MapToResponseDto(property);

            dto.BrokerPropertyCount = count;
            dto.BrokerId = property.BrokerId;

            return dto;
        }

        public async Task<PropertyResponseDto> UpdatePropertyAsync(int id, UpdatePropertyDto dto, string brokerId)
        {
            var property = await _context.Properties
                .Include(p => p.Photos)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (property == null || property.BrokerId != brokerId)
                return null;

           

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

            if (!string.IsNullOrEmpty(dto.DistanceFromLandmark)) property.DistanceFromLandmark = dto.DistanceFromLandmark;
            if (!string.IsNullOrEmpty(dto.View)) property.View = dto.View;
            if (!string.IsNullOrEmpty(dto.PaymentMethod)) property.PaymentMethod = dto.PaymentMethod;

            // أرقام (باستخدام HasValue لأنها Nullable في الـ DTO)
            if (dto.BuildYear.HasValue) property.BuildYear = dto.BuildYear.Value;
            if (dto.Floor.HasValue) property.Floor = dto.Floor.Value;
            if (dto.TotalFloors.HasValue) property.TotalFloors = dto.TotalFloors.Value;
            if (dto.ApartmentsPerFloor.HasValue) property.ApartmentsPerFloor = dto.ApartmentsPerFloor.Value;
            if (dto.ElevatorsCount.HasValue) property.ElevatorsCount = dto.ElevatorsCount.Value;
            if (dto.ReceptionPieces.HasValue) property.ReceptionPieces = dto.ReceptionPieces.Value;

            // حالات (Booleans)
            if (dto.HasMasterRoom.HasValue) property.HasMasterRoom = dto.HasMasterRoom.Value;
            if (dto.HasHotelEntrance.HasValue) property.HasHotelEntrance = dto.HasHotelEntrance.Value;
            if (dto.HasSecurity.HasValue) property.HasSecurity = dto.HasSecurity.Value;
            if (dto.IsFirstOwner.HasValue) property.IsFirstOwner = dto.IsFirstOwner.Value;
            if (dto.IsLegalReconciled.HasValue) property.IsLegalReconciled = dto.IsLegalReconciled.Value;
            if (dto.HasParking.HasValue) property.HasParking = dto.HasParking.Value;
            if (dto.InstallmentYears.HasValue) property.InstallmentYears = dto.InstallmentYears.Value;
            if (dto.HasBalcony.HasValue) property.HasBalcony = dto.HasBalcony.Value;
            if (dto.IsFurnished.HasValue) property.IsFurnished = dto.IsFurnished.Value;


            property.Region = !string.IsNullOrEmpty(dto.Region) && dto.Region != "string"
                                      ? dto.Region : property.Region;

            property.Address = !string.IsNullOrEmpty(dto.Address) && dto.Address != "string"
                                       ? dto.Address : property.Address;



            if (dto.Photos != null && dto.Photos.Count > 0)
            {
                for (int i = 0; i < dto.Photos.Count; i++)
                {
                    var result = await _photoService.AddPhotoAsync(dto.Photos[i]);
                    if (result.Error == null)
                    {
                        property.Photos.Add(new Photo
                        {
                            Url = result.SecureUrl.AbsoluteUri,
                            PublicId = result.PublicId,
                            // السطر السحري: لو الترتيب الحالي هو نفس اللي البروكر اختاره، خليها IsMain
                            IsMain = (i == dto.MainPhotoIndex)
                        });
                    }
                }
            }

            _context.Properties.Update(property);
            await _context.SaveChangesAsync();

            return MapToResponseDto(property);
        }

        public async Task<bool> SetExistingPhotoAsMainAsync(int propertyId, int photoId, string brokerId)
        {
            var property = await _context.Properties.Include(p => p.Photos)
                .FirstOrDefaultAsync(p => p.Id == propertyId && p.BrokerId == brokerId);

            if (property == null) return false;

            // 1. جعل كل الصور "ليست رئيسية"
            foreach (var p in property.Photos) p.IsMain = false;

            // 2. تحديد الصورة المختارة كـ رئيسية
            var photo = property.Photos.FirstOrDefault(p => p.Id == photoId);
            if (photo != null) photo.IsMain = true;

            return await _context.SaveChangesAsync() > 0;
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
                IsSold = property.IsSold,
                DistanceFromLandmark = property.DistanceFromLandmark,
                HasMasterRoom = property.HasMasterRoom,
                ReceptionPieces = property.ReceptionPieces,
                View = property.View,
                Floor = property.Floor,
                TotalFloors = property.TotalFloors,
                ApartmentsPerFloor = property.ApartmentsPerFloor,
                ElevatorsCount = property.ElevatorsCount,
                BuildYear = property.BuildYear,
                HasHotelEntrance = property.HasHotelEntrance,
                HasSecurity = property.HasSecurity,
                IsFirstOwner = property.IsFirstOwner,
                IsLegalReconciled = property.IsLegalReconciled,
                HasParking = property.HasParking,
                HasBalcony = property.HasBalcony,
                IsFurnished = property.IsFurnished,
                PaymentMethod = property.PaymentMethod,
                InstallmentYears = property.InstallmentYears,
                CommissionPercentage = property.CommissionPercentage,
                Address = property.Address,
                CreatedAt = property.CreatedAt,
                Photos = property.Photos.Select(p => new PhotoResponseDto
                {
                    Id = p.Id,
                    Url = p.Url,
                    IsMain = p.IsMain
                }).ToList(),
                BrokerName = property.Broker != null ? property.Broker.FirstName + " " + property.Broker.LastName : "Unknown",
                BrokerPhone = property.Broker?.PhoneNumber ?? "N/A"
            };
        }
    }
}