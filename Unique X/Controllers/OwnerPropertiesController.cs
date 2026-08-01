using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs;

namespace Unique_X.Controllers
{
    [Route("api/owner-properties")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class OwnerPropertiesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OwnerPropertiesController(AppDbContext context)
        {
            _context = context;
        }

        public class ApproveOwnerPropertyDto
        {
            public string BrokerId { get; set; }
        }

        public class RejectOwnerPropertyDto
        {
            public string Reason { get; set; }
        }

        // GET api/owner-properties
        // كل الوحدات اللي اتقدمت من زرار "Add Your Property" (Pending, Approved, أو Rejected)
        // بترجع بنفس شكل PropertyResponseDto بالظبط عشان تشتغل مع نفس مودال الـ View بتاع Pending Review
        [HttpGet]
        public async Task<IActionResult> GetOwnerProperties()
        {
            var properties = await _context.Properties
                .Include(p => p.Photos)
                .Include(p => p.Broker)
                .Include(p => p.PaymentPlans)
                .Where(p => p.IsOwnerSubmitted)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var result = properties.Select(p => MapToDto(p)).ToList();
            return Ok(result);
        }

        // نفس منطق MapToResponseDto الخاص في PropertiesService.cs، منسوخ هنا عشان الكونترولر ده يفضل مستقل
        private PropertyResponseDto MapToDto(Unique_X.Models.Property property)
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

                Floor = property.Floor,
                TotalFloors = property.TotalFloors,
                ApartmentsPerFloor = property.ApartmentsPerFloor,
                ElevatorsCount = property.ElevatorsCount,
                BuildYear = property.BuildYear,
                ReceptionPieces = property.ReceptionPieces,
                DeliveryYear = property.DeliveryYear,

                PaymentMethod = property.PaymentMethod,
                SecurityDeposit = property.SecurityDeposit,
                MonthlyRent = property.MonthlyRent,
                CommissionPercentage = property.CommissionPercentage,

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

                // ملحوظة: لسه ما اتحددش بروكر حقيقي غير لو اتوافق عليها؛ لحد ما ده يحصل
                // الاسم هنا بيبين اسم اللي قدم الطلب (BrokerId مؤقتًا = ID بتاعه)
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
                   .Select(p => new PhotoResponseDto
                   {
                       Id = p.Id,
                       Url = p.Url,
                       IsMain = p.IsMain
                   }).ToList() ?? new List<PhotoResponseDto>()
            };
        }

        // PATCH api/owner-properties/5/approve
        // الأدمن هنا لازم يختار البروكر اللي الوحدة هتتنسبله
        [HttpPatch("{id}/approve")]
        public async Task<IActionResult> Approve(int id, [FromBody] ApproveOwnerPropertyDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.BrokerId))
                return BadRequest("You must select a broker to approve this property.");

            var property = await _context.Properties.FindAsync(id);
            if (property == null) return NotFound("Property not found");

            var brokerExists = await _context.Users.AnyAsync(u => u.Id == dto.BrokerId);
            if (!brokerExists) return BadRequest("Selected broker does not exist.");

            property.BrokerId = dto.BrokerId;
            property.IsApproved = true;
            property.IsActive = true;
            property.RejectionReason = null;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Property approved and assigned to broker successfully." });
        }

        // PATCH api/owner-properties/5/reject
        [HttpPatch("{id}/reject")]
        public async Task<IActionResult> Reject(int id, [FromBody] RejectOwnerPropertyDto dto)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null) return NotFound("Property not found");

            property.IsApproved = false;
            property.IsActive = false;
            property.RejectionReason = dto?.Reason ?? "Rejected by admin";

            await _context.SaveChangesAsync();
            return Ok(new { message = "Property rejected." });
        }
    }
}