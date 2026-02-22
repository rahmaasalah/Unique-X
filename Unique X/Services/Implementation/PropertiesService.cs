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
                Code = dto.Code ?? string.Empty,

                // التصنيفات (Enums)
                City = (City)(dto.City ?? 1),
                ListingType = (ListingType)(dto.ListingType ?? 0),
                PropertyType = (PropertyType)(dto.PropertyType ?? 0),
                Finishing = dto.Finishing ?? FinishingType.FullyFinished,
                DeliveryStatus = dto.DeliveryStatus ?? DeliveryStatus.Ready,

                // الموقع
                Region = dto.Region ?? string.Empty,
                Address = dto.Address ?? string.Empty,
                DistanceFromLandmark = dto.DistanceFromLandmark,
                View = dto.View,
                ProjectName = dto.ProjectName,

                // تفاصيل البناء
                Floor = dto.Floor ?? 0,
                TotalFloors = dto.TotalFloors ?? 0,
                ApartmentsPerFloor = dto.ApartmentsPerFloor ?? 0,
                ElevatorsCount = dto.ElevatorsCount ?? 0,
                BuildYear = dto.BuildYear ?? DateTime.UtcNow.Year,
                ReceptionPieces = dto.ReceptionPieces ?? 0,
                DeliveryYear = dto.DeliveryYear,


                AreaType = dto.AreaType,
                VillaCategory = dto.VillaCategory,
                VillaSubType = dto.VillaSubType,
                GroundRooms = dto.GroundRooms,
                GroundBaths = dto.GroundBaths,
                GroundReception = dto.GroundReception,
                FirstRooms = dto.FirstRooms,
                FirstBaths = dto.FirstBaths,
                FirstReception = dto.FirstReception,
                SecondRooms = dto.SecondRooms,
                SecondBaths = dto.SecondBaths,
                SecondReception = dto.SecondReception,

                // البيانات المالية
                PaymentMethod = dto.PaymentMethod ?? "Cash",
                InstallmentYears = dto.InstallmentYears,
                DownPayment = dto.DownPayment,
                QuarterInstallment = dto.QuarterInstallment,
                MonthlyRent = dto.MonthlyRent,
                SecurityDeposit = dto.SecurityDeposit,
                CommissionPercentage = 2.5m, // قيمة ثابتة أو يمكن أخذها من dto.CommissionPercentage

                // الحالات والخدمات (Booleans)
                HasMasterRoom = dto.HasMasterRoom ?? false,
                HasGarden = dto.HasGarden ?? false,
                HasPool = dto.HasPool ?? false,
                HasHotelEntrance = dto.HasHotelEntrance ?? false,
                HasSecurity = dto.HasSecurity ?? false,
                HasParking = dto.HasParking ?? false,
                HasBalcony = dto.HasBalcony ?? false,
                IsFurnished = dto.IsFurnished ?? false,
                IsFirstOwner = dto.IsFirstOwner ?? false,
                IsLegalReconciled = dto.IsLegalReconciled ?? false,
                IsLicensed = dto.IsLicensed ?? false,
                HasLandShare = dto.HasLandShare ?? false,
                HasWaterMeter = dto.HasWaterMeter ?? false,
                HasElectricityMeter = dto.HasElectricityMeter ?? false,
                HasGasMeter = dto.HasGasMeter ?? false,

                BrokerId = brokerId,
                Photos = new List<Photo>()
            };

            // معالجة رفع الصور
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
            

            // فلترة الكود (Exact match)
            if (!string.IsNullOrEmpty(filter.Code))
                query = query.Where(p => p.Code == filter.Code);

            // فلترة سنة البناء (اكبر من او يساوي)
            if (filter.BuildYear.HasValue)
                query = query.Where(p => p.BuildYear >= filter.BuildYear.Value);

            // فلترة المساحة (اكبر من او يساوي)
            if (filter.Area.HasValue)
                query = query.Where(p => p.Area >= filter.Area.Value);

            // فلترة الغرف (Range)
            if (filter.MinRooms.HasValue) query = query.Where(p => p.Rooms >= filter.MinRooms.Value);
            if (filter.MaxRooms.HasValue) query = query.Where(p => p.Rooms <= filter.MaxRooms.Value);

            // فلترة الحمامات (Range)
            if (filter.MinBathrooms.HasValue) query = query.Where(p => p.Bathrooms >= filter.MinBathrooms.Value);
            if (filter.MaxBathrooms.HasValue) query = query.Where(p => p.Bathrooms <= filter.MaxBathrooms.Value);

            // فلترة الدور (Range)
            if (filter.MinFloor.HasValue) query = query.Where(p => p.Floor >= filter.MinFloor.Value);
            if (filter.MaxFloor.HasValue) query = query.Where(p => p.Floor <= filter.MaxFloor.Value);

            if (!string.IsNullOrEmpty(filter.BrokerId))
                query = query.Where(p => p.BrokerId == filter.BrokerId);

            if (!string.IsNullOrEmpty(filter.ProjectName))
                query = query.Where(p => p.ProjectName != null && p.ProjectName.ToLower().Contains(filter.ProjectName.ToLower()));

            if (filter.ListingType.HasValue)
            {
                // سيبحث عن النوع المختار بدقة (0 أو 1 أو 2 أو 3)
                query = query.Where(p => p.ListingType == (ListingType)filter.ListingType.Value);
            }
            query = query.Where(p => !p.IsSold && p.IsActive); // شرط إضافي


            if (!string.IsNullOrEmpty(filter.SearchTerm))
            {
                var search = filter.SearchTerm.ToLower();

                query = query.Where(p =>
                    p.Title.ToLower().Contains(search) ||
                    p.Region.ToLower().Contains(search) ||
                    p.PropertyType.ToString().ToLower().Contains(search) ||
                    (p.ProjectName != null && p.ProjectName.ToLower().Contains(search))
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
                .Include(p => p.Broker)
                .FirstOrDefaultAsync(p => p.Id == id && p.BrokerId == brokerId);
           

            if (property == null || property.BrokerId != brokerId)
                return null;


            if (!string.IsNullOrEmpty(dto.Title) && dto.Title != "string") property.Title = dto.Title;
            if (!string.IsNullOrEmpty(dto.Description) && dto.Description != "string") property.Description = dto.Description;
            if (!string.IsNullOrEmpty(dto.Code) && dto.Code != "string") property.Code = dto.Code;
            if (!string.IsNullOrEmpty(dto.Region) && dto.Region != "string") property.Region = dto.Region;
            if (!string.IsNullOrEmpty(dto.Address) && dto.Address != "string") property.Address = dto.Address;
            if (!string.IsNullOrEmpty(dto.View) && dto.View != "string") property.View = dto.View;
            if (!string.IsNullOrEmpty(dto.DistanceFromLandmark)) property.DistanceFromLandmark = dto.DistanceFromLandmark;
            if (!string.IsNullOrEmpty(dto.PaymentMethod)) property.PaymentMethod = dto.PaymentMethod;
            if (!string.IsNullOrEmpty(dto.ProjectName) && dto.ProjectName != "string") property.ProjectName = dto.ProjectName;

            // تحديث الأرقام والـ Enums (فقط إذا كان لها قيمة)
            if (dto.Price.HasValue && dto.Price > 0) property.Price = dto.Price.Value;
            if (dto.Area.HasValue && dto.Area > 0) property.Area = dto.Area.Value;
            if (dto.Rooms.HasValue) property.Rooms = dto.Rooms.Value;
            if (dto.Bathrooms.HasValue) property.Bathrooms = dto.Bathrooms.Value;
            if (dto.City.HasValue) property.City = (City)dto.City.Value;
            if (dto.ListingType.HasValue) property.ListingType = (ListingType)dto.ListingType.Value;
            if (dto.PropertyType.HasValue) property.PropertyType = (PropertyType)dto.PropertyType.Value;
            if (dto.Finishing.HasValue) property.Finishing = dto.Finishing.Value;
            if (dto.DeliveryStatus.HasValue) property.DeliveryStatus = dto.DeliveryStatus.Value;
            if (dto.DeliveryYear.HasValue) property.DeliveryYear = dto.DeliveryYear.Value;

            if (dto.GroundRooms.HasValue) property.GroundRooms = dto.GroundRooms.Value;
            if (dto.GroundBaths.HasValue) property.GroundBaths = dto.GroundBaths.Value;
            if (dto.GroundReception.HasValue) property.GroundReception = dto.GroundReception.Value;
            if (dto.FirstRooms.HasValue) property.FirstRooms = dto.FirstRooms.Value;
            if (dto.FirstBaths.HasValue) property.FirstBaths = dto.FirstBaths.Value;
            if (dto.FirstReception.HasValue) property.FirstReception = dto.FirstReception.Value;
            if (dto.SecondRooms.HasValue) property.SecondRooms = dto.SecondRooms.Value;
            if(dto.SecondBaths.HasValue) property.SecondBaths = dto.SecondBaths.Value;
            if (dto.SecondReception.HasValue) property.SecondReception = dto.SecondReception.Value;

            // تحديث تفاصيل البناء
            if (dto.BuildYear.HasValue) property.BuildYear = dto.BuildYear.Value;
            if (dto.Floor.HasValue) property.Floor = dto.Floor.Value;
            if (dto.TotalFloors.HasValue) property.TotalFloors = dto.TotalFloors.Value;
            if (dto.ApartmentsPerFloor.HasValue) property.ApartmentsPerFloor = dto.ApartmentsPerFloor.Value;
            if (dto.ElevatorsCount.HasValue) property.ElevatorsCount = dto.ElevatorsCount.Value;
            if (dto.ReceptionPieces.HasValue) property.ReceptionPieces = dto.ReceptionPieces.Value;

            if (dto.HasPool.HasValue) property.HasPool = dto.HasPool.Value;
            if (dto.HasGarden.HasValue) property.HasGarden = dto.HasGarden.Value;

            // تحديث البيانات المالية (Nullable Decimals)
            if (dto.MonthlyRent.HasValue) property.MonthlyRent = dto.MonthlyRent.Value;
            if (dto.DownPayment.HasValue) property.DownPayment = dto.DownPayment.Value;
            if (dto.QuarterInstallment.HasValue) property.QuarterInstallment = dto.QuarterInstallment.Value;
            if (dto.SecurityDeposit.HasValue) property.SecurityDeposit = dto.SecurityDeposit.Value;
            if (dto.InstallmentYears.HasValue) property.InstallmentYears = dto.InstallmentYears.Value;

            // تحديث الـ Booleans
            if (dto.HasMasterRoom.HasValue) property.HasMasterRoom = dto.HasMasterRoom.Value;
            if (dto.HasHotelEntrance.HasValue) property.HasHotelEntrance = dto.HasHotelEntrance.Value;
            if (dto.HasSecurity.HasValue) property.HasSecurity = dto.HasSecurity.Value;
            if (dto.IsFirstOwner.HasValue) property.IsFirstOwner = dto.IsFirstOwner.Value;
            if (dto.IsLegalReconciled.HasValue) property.IsLegalReconciled = dto.IsLegalReconciled.Value;
            if (dto.HasParking.HasValue) property.HasParking = dto.HasParking.Value;
            if (dto.HasBalcony.HasValue) property.HasBalcony = dto.HasBalcony.Value;
            if (dto.IsFurnished.HasValue) property.IsFurnished = dto.IsFurnished.Value;
            if (dto.HasLandShare.HasValue) property.HasLandShare = dto.HasLandShare.Value;
            if (dto.HasElectricityMeter.HasValue) property.HasElectricityMeter = dto.HasElectricityMeter.Value;
            if (dto.HasGasMeter.HasValue) property.HasGasMeter = dto.HasGasMeter.Value;
            if (dto.HasWaterMeter.HasValue) property.HasWaterMeter = dto.HasWaterMeter.Value;
            if (dto.IsLicensed.HasValue) property.IsLicensed = dto.IsLicensed.Value;

            // معالجة الصور الجديدة إذا رُفعت
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
                Code = property.Code,

                // تحويل الـ Enums لنصوص مفهومة للـ UI
                City = property.City.ToString(),
                ListingType = property.ListingType.ToString(),
                PropertyType = property.PropertyType.ToString(),
                Finishing = property.Finishing,
                DeliveryStatus = property.DeliveryStatus,
                Region = property.Region,
                Address = property.Address,
                IsSold = property.IsSold,
                DistanceFromLandmark = property.DistanceFromLandmark,
                View = property.View,
                ProjectName = property.ProjectName,

                // البيانات الفنية
                Floor = property.Floor,
                TotalFloors = property.TotalFloors,
                ApartmentsPerFloor = property.ApartmentsPerFloor,
                ElevatorsCount = property.ElevatorsCount,
                BuildYear = property.BuildYear,
                ReceptionPieces = property.ReceptionPieces,
                DeliveryYear = property.DeliveryYear,

                // البيانات المالية والخدمات
                PaymentMethod = property.PaymentMethod,
                InstallmentYears = property.InstallmentYears,
                DownPayment = property.DownPayment,
                QuarterInstallment = property.QuarterInstallment,
                SecurityDeposit = property.SecurityDeposit,
                MonthlyRent = property.MonthlyRent,
                CommissionPercentage = property.CommissionPercentage,

                // المميزات (Booleans)
                HasMasterRoom = property.HasMasterRoom,
                HasHotelEntrance = property.HasHotelEntrance,
                HasSecurity = property.HasSecurity,
                IsFirstOwner = property.IsFirstOwner,
                IsLegalReconciled = property.IsLegalReconciled,
                HasParking = property.HasParking,
                HasBalcony = property.HasBalcony,
                IsFurnished = property.IsFurnished,
                HasWaterMeter = property.HasWaterMeter,
                HasElectricityMeter = property.HasElectricityMeter,
                HasGasMeter = property.HasGasMeter,
                HasLandShare = property.HasLandShare,
                IsLicensed = property.IsLicensed,

                AreaType = property.AreaType?.ToString(),
                VillaCategory = property.VillaCategory.ToString(),
                VillaSubType = property.VillaSubType.ToString(),

                HasGarden = property.HasGarden,
                HasPool = property.HasPool,
                GroundBaths = property.GroundBaths,
                GroundReception = property.GroundReception,
                GroundRooms = property.GroundRooms,
                FirstReception = property.FirstReception,
                FirstBaths = property.FirstBaths,
                FirstRooms = property.FirstRooms,
                SecondReception = property.SecondReception,
                SecondBaths = property.SecondBaths,
                SecondRooms = property.SecondRooms,

                CreatedAt = property.CreatedAt,
                BrokerId = property.BrokerId,
                BrokerName = property.Broker != null ? $"{property.Broker.FirstName} {property.Broker.LastName}" : "System Agent",
                BrokerPhone = property.Broker?.PhoneNumber ?? "N/A",

                Photos = property.Photos?.Select(p => new PhotoResponseDto
                {
                    Id = p.Id,
                    Url = p.Url,
                    IsMain = p.IsMain
                }).ToList() ?? new List<PhotoResponseDto>()
            };
        }
    }
}