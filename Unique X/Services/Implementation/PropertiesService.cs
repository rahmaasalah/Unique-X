using CloudinaryDotNet;
using Microsoft.EntityFrameworkCore;
using System.Security.Principal;
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

        // 🟢 المطورين والمشاريع (Primary/Resale) والمناطق بقوا متخزنين في جداول Developers/Projects/Regions
        // بدل الـ Dictionaries الهاردكودد اللي كانت هنا، وبتتضاف/تتحذف من صفحة "Lookups" في الـ admin dashboard.
        // القيم القديمة اتنقلت للداتابيز مرة واحدة عن طريق DbSeeder.SeedLookupsAsync، فكود العقارات
        // الحالية والمستقبلية مش بيتأثر. شوفي GenerateSmartCodeAsync تحت.

        private readonly Dictionary<string, int> LegacySequenceStarters = new(StringComparer.OrdinalIgnoreCase)
        {
            {"NR93-", 51}, {"NPR93-", 85},
            {"ARP1-", 22}, {"ARP2-", 38}, {"ARP3-", 43}, {"ARP6-", 13}, {"ARP5-", 7},
            {"ARP4-", 15}, {"ARP9-", 3}, {"ARP8-", 2}, {"ARP7-", 18}, {"ARP11-", 2},
            {"ARP12-", 1}, {"AR69-", 120}, {"AR72-", 59}, {"AR43-", 28}, {"AR34-", 18},
            {"AR41-", 28}, {"AR42-", 27}, {"AR91-", 26}, {"AR33-", 15}, {"AR32-", 26},
            {"AR68-", 18}, {"AR45-", 55}, {"AR61-", 35}, {"AR71-", 16}, {"AR67-", 37},
            {"AR50-", 7}, {"AR47-", 43}, {"AR46-", 26}, {"AR48-", 38}, {"AR49-", 52},
            {"AR51-", 4}, {"AR52-", 3}, {"AR56-", 54}, {"AR63-", 327}, {"AR59-", 109},
            {"AR23-", 127}, {"AR2-", 11}, {"AR92-", 35}, {"AR97-", 15}
        };


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

                OwnerName = dto.OwnerName ?? string.Empty,
                OwnerPhone = dto.OwnerPhone ?? string.Empty,
                DeveloperName = dto.DeveloperName,
                PricePerMeter = dto.PricePerMeter ?? 0,

                BuiltUpArea = dto.BuiltUpArea,
                LandArea = dto.LandArea,

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
                MonthlyRent = dto.MonthlyRent,
                SecurityDeposit = dto.SecurityDeposit,
                CommissionPercentage = 2.5m,

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
                IsActive = false,
                IsApproved = false,
                RejectionReason = null,
                IsOwnerSubmitted = dto.IsOwnerSubmitted ?? false,
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
                            IsMain = (i == dto.MainPhotoIndex),
                            DisplayOrder = i
                        });
                    }
                }
            }

            if (dto.PaymentPlans != null && dto.PaymentPlans.Any())
            {
                foreach (var plan in dto.PaymentPlans)
                {
                    property.PaymentPlans.Add(new PaymentPlan
                    {
                        InstallmentYears = plan.InstallmentYears,
                        DownPayment = plan.DownPayment,
                        QuarterInstallment = plan.InstallmentAmount,
                        Frequency = string.IsNullOrEmpty(plan.Frequency) ? "Quarterly" : plan.Frequency

                    });
                }
            }

            property.Code = await GenerateSmartCodeAsync(property);


            await _context.Properties.AddAsync(property);
            await _context.SaveChangesAsync();
            await _context.Entry(property).Reference(p => p.Broker).LoadAsync();

            return MapToResponseDto(property);
        }

        public async Task<IEnumerable<PropertyResponseDto>> GetAllPropertiesAsync(PropertyFilterDto filter, string userId)
        {

            var userFavorites = new List<int>();
            var userShortlisted = new List<int>();
            var userVisitListed = new List<int>();
            if (!string.IsNullOrEmpty(userId))
            {
                userFavorites = await _context.Wishlists
                    .Where(w => w.UserId == userId)
                    .Select(w => w.PropertyId)
                    .ToListAsync();

                userShortlisted = await _context.Shortlists
                    .Where(s => s.UserId == userId)
                    .Select(s => s.PropertyId)
                    .ToListAsync();

                userVisitListed = await _context.VisitLists
                    .Where(v => v.UserId == userId)
                    .Select(v => v.PropertyId)
                    .ToListAsync();
            }

            var query = _context.Properties
                .Include(p => p.Photos)
                .Include(p => p.Broker)
                .Include(p => p.PaymentPlans)
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


            if (!string.IsNullOrEmpty(filter.Code))
                query = query.Where(p => p.Code == filter.Code);

            if (filter.BuildYear.HasValue)
                query = query.Where(p => p.BuildYear >= filter.BuildYear.Value);

            if (filter.Area.HasValue)
                query = query.Where(p => p.Area >= filter.Area.Value);

            if (filter.MinRooms.HasValue) query = query.Where(p => p.Rooms >= filter.MinRooms.Value);
            if (filter.MaxRooms.HasValue) query = query.Where(p => p.Rooms <= filter.MaxRooms.Value);

            if (filter.MinBathrooms.HasValue) query = query.Where(p => p.Bathrooms >= filter.MinBathrooms.Value);
            if (filter.MaxBathrooms.HasValue) query = query.Where(p => p.Bathrooms <= filter.MaxBathrooms.Value);

            if (filter.MinFloor.HasValue) query = query.Where(p => p.Floor >= filter.MinFloor.Value);
            if (filter.MaxFloor.HasValue) query = query.Where(p => p.Floor <= filter.MaxFloor.Value);

            if (!string.IsNullOrEmpty(filter.BrokerId))
            {
                // لو فيه ID، فلتر بالـ ID فوراً وتجاهل أي شيء آخر
                query = query.Where(p => p.BrokerId == filter.BrokerId);
            }
            else if (!string.IsNullOrEmpty(filter.BrokerName))
            {
                // البحث بالاسم فقط إذا لم يوجد ID
                var searchName = filter.BrokerName.Replace("-", " ").Trim().ToLower();
                query = query.Where(p => (p.Broker.FirstName + " " + p.Broker.LastName).ToLower() == searchName);
            }

            //if (!string.IsNullOrEmpty(filter.BrokerName))
            //{
            //    var searchName = filter.BrokerName.Replace("-", " ").Trim().ToLower();

            //    query = query.Where(p =>
            //        (p.Broker.FirstName + " " + p.Broker.LastName).ToLower() == searchName
            //    );
            //}

            if (!string.IsNullOrEmpty(filter.ProjectName))
            {
                var terms = filter.ProjectName.ToLower().Split('|', StringSplitOptions.RemoveEmptyEntries);
                if (terms.Length == 1)
                {
                    var t = terms[0];
                    query = query.Where(p => p.ProjectName != null && p.ProjectName.ToLower().Contains(t));
                }
                else
                {
                    var t1 = terms[0];
                    var t2 = terms[1];
                    query = query.Where(p => p.ProjectName != null &&
                                            (p.ProjectName.ToLower().Contains(t1) || p.ProjectName.ToLower().Contains(t2)));
                }
            }

            if (filter.ListingType.HasValue)
            {
                query = query.Where(p => p.ListingType == (ListingType)filter.ListingType.Value);
            }
            query = query.Where(p => !p.IsSold && p.IsActive && p.IsApproved);

            if (!string.IsNullOrEmpty(filter.SearchTerm))
            {
                var terms = filter.SearchTerm.ToLower().Split('|', StringSplitOptions.RemoveEmptyEntries);
                if (terms.Length == 1)
                {
                    var t = terms[0];
                    query = query.Where(p =>
                        p.Title.ToLower().Contains(t) ||
                        p.Region.ToLower().Contains(t) ||
                        p.PropertyType.ToString().ToLower().Contains(t) ||
                        (p.ProjectName != null && p.ProjectName.ToLower().Contains(t))
                    );
                }
                else
                {
                    var t1 = terms[0];
                    var t2 = terms[1];
                    query = query.Where(p =>
                        p.Title.ToLower().Contains(t1) || p.Region.ToLower().Contains(t1) || p.PropertyType.ToString().ToLower().Contains(t1) || (p.ProjectName != null && p.ProjectName.ToLower().Contains(t1)) ||
                        p.Title.ToLower().Contains(t2) || p.Region.ToLower().Contains(t2) || p.PropertyType.ToString().ToLower().Contains(t2) || (p.ProjectName != null && p.ProjectName.ToLower().Contains(t2))
                    );
                }
            }

            var properties = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();

            return properties.Select(p => {
                var dto = MapToResponseDto(p);
                dto.IsFavorite = userFavorites.Contains(p.Id);
                dto.IsShortlisted = userShortlisted.Contains(p.Id);
                dto.IsVisitListed = userVisitListed.Contains(p.Id);
                return dto;
            });
        }

        public async Task<bool> MarkAsSoldAsync(int id, string brokerId)
        {
            var property = await _context.Properties
                .FirstOrDefaultAsync(p => p.Id == id && p.BrokerId == brokerId);

            if (property == null) return false;

            bool newSoldStatus = !property.IsSold;

            string baseCode = property.Code;
            if (!string.IsNullOrEmpty(baseCode) && baseCode.Contains("-COPY"))
            {
                baseCode = baseCode.Split("-COPY")[0];
            }

            if (string.IsNullOrEmpty(baseCode))
            {
                property.IsSold = newSoldStatus;
            }
            else
            {

                var relatedProperties = await _context.Properties
                    .Where(p => p.Code == baseCode || p.Code.StartsWith(baseCode + "-COPY"))
                    .ToListAsync();

                foreach (var prop in relatedProperties)
                {
                    prop.IsSold = newSoldStatus;
                }
            }

            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<IEnumerable<PropertyResponseDto>> GetBrokerPropertiesAsync(string brokerId)
        {
            var properties = await _context.Properties
                .Include(p => p.Photos)
                .Include(p => p.Broker)
                .Include(p => p.PaymentPlans)
                // لو الوحدة اتقدمت من "Add Your Property" ولسه ماتوافقش عليها الأدمن، متظهرش في داشبورد أي بروكر
                // (حتى لو BrokerId لسه شايل ID البروكر اللي قدمها بنفسه كـ placeholder مؤقت)
                .Where(p => p.BrokerId == brokerId && (!p.IsOwnerSubmitted || p.IsApproved))
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
                .Include(p => p.PaymentPlans)
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
                .Include(p => p.PaymentPlans)
                .FirstOrDefaultAsync(p => p.Id == id && p.BrokerId == brokerId);

            if (property == null)
                return null;


            var oldCity = property.City;
            var oldListingType = property.ListingType;
            var oldPropertyType = property.PropertyType;
            var oldProjectName = property.ProjectName ?? "";
            var oldDeveloperName = property.DeveloperName ?? "";
            var oldRegion = property.Region ?? "";


            if (!string.IsNullOrEmpty(dto.Title) && dto.Title != "string") property.Title = dto.Title;
            if (!string.IsNullOrEmpty(dto.Description) && dto.Description != "string") property.Description = dto.Description;
            //if (!string.IsNullOrEmpty(dto.Code) && dto.Code != "string") property.Code = dto.Code;
            if (!string.IsNullOrEmpty(dto.Region) && dto.Region != "string") property.Region = dto.Region;
            if (!string.IsNullOrEmpty(dto.Address) && dto.Address != "string") property.Address = dto.Address;
            if (!string.IsNullOrEmpty(dto.View) && dto.View != "string") property.View = dto.View;
            if (!string.IsNullOrEmpty(dto.DistanceFromLandmark)) property.DistanceFromLandmark = dto.DistanceFromLandmark;
            if (!string.IsNullOrEmpty(dto.PaymentMethod)) property.PaymentMethod = dto.PaymentMethod;
            if (!string.IsNullOrEmpty(dto.ProjectName) && dto.ProjectName != "string") property.ProjectName = dto.ProjectName;

            if (dto.OwnerName != null) property.OwnerName = dto.OwnerName;
            if (dto.OwnerPhone != null) property.OwnerPhone = dto.OwnerPhone;
            if (dto.DeveloperName != null) property.DeveloperName = dto.DeveloperName;

            if (dto.Price.HasValue && dto.Price > 0) property.Price = dto.Price.Value;
            if (dto.PricePerMeter.HasValue && dto.PricePerMeter > 0) property.PricePerMeter = dto.PricePerMeter.Value; // 🟢 أضيفي هذا السطر

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
            if (dto.SecondBaths.HasValue) property.SecondBaths = dto.SecondBaths.Value;
            if (dto.SecondReception.HasValue) property.SecondReception = dto.SecondReception.Value;
            if (dto.AreaType.HasValue) property.AreaType = dto.AreaType.Value;
            if (dto.VillaCategory.HasValue) property.VillaCategory = dto.VillaCategory.Value;
            if (dto.VillaSubType.HasValue) property.VillaSubType = dto.VillaSubType.Value;

            // تحديث تفاصيل البناء
            if (dto.BuildYear.HasValue) property.BuildYear = dto.BuildYear.Value;
            if (dto.Floor.HasValue) property.Floor = dto.Floor.Value;
            if (dto.TotalFloors.HasValue) property.TotalFloors = dto.TotalFloors.Value;
            if (dto.ApartmentsPerFloor.HasValue) property.ApartmentsPerFloor = dto.ApartmentsPerFloor.Value;
            if (dto.ElevatorsCount.HasValue) property.ElevatorsCount = dto.ElevatorsCount.Value;
            if (dto.ReceptionPieces.HasValue) property.ReceptionPieces = dto.ReceptionPieces.Value;

            if (dto.HasPool.HasValue) property.HasPool = dto.HasPool.Value;
            if (dto.HasGarden.HasValue) property.HasGarden = dto.HasGarden.Value;

            if (dto.MonthlyRent.HasValue) property.MonthlyRent = dto.MonthlyRent.Value;

            if (dto.SecurityDeposit.HasValue) property.SecurityDeposit = dto.SecurityDeposit.Value;

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

            if (dto.Photos != null && dto.Photos.Count > 0)
            {
                if (dto.MainPhotoIndex != null)
                {
                    foreach (var p in property.Photos) p.IsMain = false;
                }

                // الصور الجديدة بتتضاف بعد القديمة، فبنكمل الترقيم من أعلى DisplayOrder موجود
                int nextOrder = property.Photos.Any() ? property.Photos.Max(p => p.DisplayOrder) + 1 : 0;

                for (int i = 0; i < dto.Photos.Count; i++)
                {
                    var result = await _photoService.AddPhotoAsync(dto.Photos[i]);
                    if (result.Error == null)
                    {
                        property.Photos.Add(new Photo
                        {
                            Url = result.SecureUrl.AbsoluteUri,
                            PublicId = result.PublicId,
                            IsMain = (i == dto.MainPhotoIndex),
                            DisplayOrder = nextOrder + i
                        });
                    }
                }
            }

            if (dto.PaymentPlans != null)
            {
                var existingPlans = await _context.PaymentPlans.Where(p => p.PropertyId == id).ToListAsync();
                _context.PaymentPlans.RemoveRange(existingPlans);

                foreach (var plan in dto.PaymentPlans)
                {
                    property.PaymentPlans.Add(new PaymentPlan
                    {
                        InstallmentYears = plan.InstallmentYears,
                        DownPayment = plan.DownPayment,
                        QuarterInstallment = plan.InstallmentAmount,
                        Frequency = string.IsNullOrEmpty(plan.Frequency) ? "Quarterly" : plan.Frequency
                    });
                }
            }

            bool codeTriggersChanged =
                oldCity != property.City ||
                oldListingType != property.ListingType ||
                oldPropertyType != property.PropertyType ||
                oldProjectName != (property.ProjectName ?? "") ||
                oldDeveloperName != (property.DeveloperName ?? "") ||
                oldRegion != (property.Region ?? "");

            if (codeTriggersChanged || string.IsNullOrEmpty(property.Code))
            {
                property.Code = await GenerateSmartCodeAsync(property);
            }

            property.IsApproved = false;
            property.IsActive = false;
            property.RejectionReason = null;

            _context.Properties.Update(property);
            await _context.SaveChangesAsync();

            return MapToResponseDto(property);
        }

        public async Task<bool> SetExistingPhotoAsMainAsync(int propertyId, int photoId, string brokerId)
        {
            var property = await _context.Properties.Include(p => p.Photos)
                .FirstOrDefaultAsync(p => p.Id == propertyId && p.BrokerId == brokerId);

            if (property == null) return false;

            foreach (var p in property.Photos) p.IsMain = false;

            var photo = property.Photos.FirstOrDefault(p => p.Id == photoId);
            if (photo != null) photo.IsMain = true;

            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> DeletePropertyAsync(int id, string brokerId)
        {
            var property = await _context.Properties
                .FirstOrDefaultAsync(p => p.Id == id && p.BrokerId == brokerId);

            if (property == null)
                return false;

            property.PendingDeletion = true;
            property.DeletionRequestedAt = DateTime.UtcNow;
            property.DeletionRejectionReason = null;

            return await _context.SaveChangesAsync() > 0;
        }


        public async Task<bool> DeletePhotoAsync(int propertyId, int photoId, string brokerId)
        {
            var property = await _context.Properties
                .Include(p => p.Photos)
                .FirstOrDefaultAsync(p => p.Id == propertyId && p.BrokerId == brokerId);

            if (property == null) return false;

            var photo = property.Photos.FirstOrDefault(p => p.Id == photoId);
            if (photo == null) return false;

            if (photo.IsMain) return false;

            if (!string.IsNullOrEmpty(photo.PublicId))
            {
                await _photoService.DeletePhotoAsync(photo.PublicId);
            }

            property.Photos.Remove(photo);
            return await _context.SaveChangesAsync() > 0;
        }

        private PropertyResponseDto MapToResponseDto(Property property)
        {
            return new PropertyResponseDto
            {
                Id = property.Id,
                Title = property.Title,
                Description = property.Description,
                IsHotDeal = _context.HotDeals.Any(h => h.PropertyId == property.Id),
                Price = property.Price,
                Area = property.Area,
                Rooms = property.Rooms,
                Bathrooms = property.Bathrooms,
                Code = property.Code,
                PricePerMeter = property.PricePerMeter,

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
                OwnerName = property.OwnerName,
                OwnerPhone = property.OwnerPhone,
                DeveloperName = property.DeveloperName,

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

                AreaType = property.AreaType,
                VillaCategory = property.VillaCategory,
                VillaSubType = property.VillaSubType,

                BuiltUpArea = property.BuiltUpArea,
                LandArea = property.LandArea,

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
                IsApproved = property.IsApproved,
                IsActive = property.IsActive,
                RejectionReason = property.RejectionReason,
                IsOwnerSubmitted = property.IsOwnerSubmitted,
                PendingDeletion = property.PendingDeletion,
                DeletionRejectionReason = property.DeletionRejectionReason,
                BrokerName = property.Broker != null ? $"{property.Broker.FirstName} {property.Broker.LastName}" : "System Agent",
                BrokerPhone = property.Broker?.PhoneNumber ?? "N/A",
                BrokerImage = property.Broker?.ProfileImageUrl,
                BrokerTitle = property.Broker?.BrokerTitle,
                BrokerDescription = property.Broker?.BrokerDescription,



                PaymentPlans = property.PaymentPlans?.Select(p => new PaymentPlanDto
                {
                    InstallmentYears = p.InstallmentYears,
                    DownPayment = p.DownPayment,
                    InstallmentAmount = p.QuarterInstallment,
                    Frequency = p.Frequency ?? "Quarterly"
                }).ToList() ?? new List<PaymentPlanDto>(),

                Photos = property.Photos?
                   .OrderByDescending(p => p.IsMain)
                   .ThenBy(p => p.DisplayOrder)
                   .Select(p => new PhotoResponseDto
                   {
                       Id = p.Id,
                       Url = p.Url,
                       IsMain = p.IsMain,
                       DisplayOrder = p.DisplayOrder
                   }).ToList() ?? new List<PhotoResponseDto>()
            };


        }

        public async Task<IEnumerable<PropertyResponseDto>> GetHotDealsAsync()
        {
            var hotDealIds = await _context.HotDeals.Select(h => h.PropertyId).ToListAsync();

            var properties = await _context.Properties
                .Include(p => p.Photos)
                .Include(p => p.Broker)
                .Include(p => p.PaymentPlans)
                .Where(p => hotDealIds.Contains(p.Id) && p.IsActive && p.IsApproved && !p.IsSold)
                .ToListAsync();

            return properties.Select(p => MapToResponseDto(p));
        }

        public async Task<IEnumerable<PropertyResponseDto>> GetRecommendedVisitsAsync()
        {
            var recommendedIds = await _context.RecommendedVisits.Select(r => r.PropertyId).ToListAsync();

            var properties = await _context.Properties
                .Include(p => p.Photos)
                .Include(p => p.Broker)
                .Include(p => p.PaymentPlans)
                .Where(p => recommendedIds.Contains(p.Id) && p.IsActive && p.IsApproved && !p.IsSold)
                .ToListAsync();

            return properties.Select(p => MapToResponseDto(p));
        }

        private async Task<string> GenerateSmartCodeAsync(Property property)
        {
            string prefix = "";

            // 1. كود المدينة
            string city = property.City == City.Cairo ? "C" :
                          property.City == City.Alexandria ? "A" : "N";

            string list = (property.ListingType == ListingType.Resale || property.ListingType == ListingType.Rent) ? "R" :
                          property.ListingType == ListingType.Primary ? "P" :
                          (property.City == City.NorthCoast ? "PR" : "RP");

            // 3. كود نوع العقار
            string type = property.PropertyType == PropertyType.Apartment ? "A" :
                          property.PropertyType == PropertyType.Villa ? "V" :
                          property.PropertyType == PropertyType.Shop ? "S" :
                          property.PropertyType == PropertyType.Office ? "O" :
                          property.PropertyType == PropertyType.Chalet ? "CH" :
                          property.PropertyType == PropertyType.FullFloor ? "F" : "";

            if (property.ListingType == ListingType.Primary)
            {
                string projCode = "";
                if (!string.IsNullOrEmpty(property.ProjectName))
                {
                    var proj = await _context.Projects.FirstOrDefaultAsync(p =>
                        p.Type == ProjectListingType.Primary && p.Name.ToLower() == property.ProjectName.ToLower());
                    projCode = proj?.Code ?? "";
                }

                string devCode = "";
                if (!string.IsNullOrEmpty(property.DeveloperName))
                {
                    var dev = await _context.Developers.FirstOrDefaultAsync(d => d.Name.ToLower() == property.DeveloperName.ToLower());
                    devCode = dev?.Code ?? (property.DeveloperName.Length >= 2 ? property.DeveloperName.Substring(0, 2).ToUpper() : "");
                }

                prefix = $"{city}{list}{type}-{projCode}{devCode}-";
            }
            else if (property.ListingType == ListingType.ResaleProject)
            {
                if (property.City == City.NorthCoast)
                {
                    prefix = "NPR93-";
                }
                else
                {
                    string projId = "0";
                    if (!string.IsNullOrEmpty(property.ProjectName))
                    {
                        var proj = await _context.Projects.FirstOrDefaultAsync(p =>
                            p.Type == ProjectListingType.Resale && p.Name.ToLower() == property.ProjectName.ToLower());
                        projId = proj?.Code ?? "0";
                    }
                    prefix = $"{city}{list}{projId}-";
                }
            }
            else
            {
                if (property.City == City.NorthCoast)
                {
                    prefix = "NR93-";
                }
                else
                {
                    string zoneId = "0";
                    if (!string.IsNullOrEmpty(property.Region))
                    {
                        var reg = await _context.Regions.FirstOrDefaultAsync(r => r.Name.ToLower() == property.Region.ToLower());
                        zoneId = reg?.ZoneCode ?? "0";
                    }
                    prefix = $"{city}{list}{zoneId}-";
                }
            }

            var existingCodes = await _context.Properties
                .Where(p => p.Code != null && p.Code.StartsWith(prefix))
                .Select(p => p.Code)
                .ToListAsync();

            int maxSeq = 0;
            foreach (var code in existingCodes)
            {
                var parts = code.Split('-');
                if (parts.Length > 0 && int.TryParse(parts.Last(), out int seq))
                {
                    if (seq > maxSeq) maxSeq = seq;
                }
            }

            if (maxSeq == 0)
            {
                if (LegacySequenceStarters.TryGetValue(prefix, out int legacyMax))
                {
                    maxSeq = legacyMax;
                }
            }

            return $"{prefix}{maxSeq + 1}";
        }

        public async Task<string> GetNextCodeAsync(string prefix)
        {
            if (string.IsNullOrEmpty(prefix)) return "";

            var existingCodes = await _context.Properties
                .Where(p => p.Code != null && p.Code.StartsWith(prefix))
                .Select(p => p.Code)
                .ToListAsync();

            int maxSeq = 0;
            foreach (var code in existingCodes)
            {
                var parts = code.Split('-');
                if (parts.Length > 0 && int.TryParse(parts.Last(), out int seq))
                {
                    if (seq > maxSeq) maxSeq = seq;
                }
            }

            if (maxSeq == 0 && LegacySequenceStarters.TryGetValue(prefix, out int legacyMax))
            {
                maxSeq = legacyMax;
            }

            return $"{prefix}{maxSeq + 1}";
        }

        public async Task<PropertyResponseDto> GetPropertyByCodeAsync(string code)
        {
            var property = await _context.Properties
                .Include(p => p.Photos)
                .Include(p => p.PaymentPlans)
                .FirstOrDefaultAsync(p => p.Code == code);

            if (property == null) return null;
            return MapToResponseDto(property);
        }
    }
}