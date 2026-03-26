using Unique_X.Models;
using static Unique_X.Models.PropEnums;

namespace Unique_X.DTOs
{
    public class PhotoResponseDto
    {
        public int Id { get; set; }
        public string Url { get; set; }
        public bool IsMain { get; set; }
    }

    public class PropertyResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public int Area { get; set; }
        public int Rooms { get; set; }
        public bool IsFavorite { get; set; }
        public int Bathrooms { get; set; }
        public string? Region { get; set; }
        public string? Address { get; set; }
        public string City { get; set; }
        public bool IsSold { get; set; } = false;
        public string? DistanceFromLandmark { get; set; } 
        public bool HasMasterRoom { get; set; }           
        public int ReceptionPieces { get; set; }          
        public string? View { get; set; }                 
        public int Floor { get; set; }                   
        public int TotalFloors { get; set; }              
        public int ApartmentsPerFloor { get; set; }        
        public int ElevatorsCount { get; set; }            
        public int BuildYear { get; set; }                 
        public bool HasHotelEntrance { get; set; }        
        public bool HasSecurity { get; set; }             
        public bool IsFirstOwner { get; set; }           
        public bool IsLegalReconciled { get; set; }       
        public bool HasParking { get; set; }             
        public decimal CommissionPercentage { get; set; } = 2.5m; 
        public bool HasBalcony { get; set; }
        public bool IsFurnished { get; set; }
        public string PaymentMethod { get; set; }
       // public int? InstallmentYears { get; set; } 
        public string ListingType { get; set; }
        public string PropertyType { get; set; }
        public DeliveryStatus DeliveryStatus { get; set; } = DeliveryStatus.Ready;
        public int? DeliveryYear { get; set; } 
        public bool? IsLicensed { get; set; }       
        public bool? HasWaterMeter { get; set; }     
        public bool? HasElectricityMeter { get; set; } 
        public bool? HasLandShare { get; set; }
        public bool? HasGasMeter { get; set; }
        //public decimal? DownPayment { get; set; }       
        //public decimal? QuarterInstallment { get; set; } 
        public decimal? SecurityDeposit { get; set; }    
        public List<PaymentPlanDto>? PaymentPlans { get; set; }
        public decimal? MonthlyRent { get; set; }
        public string? Code { get; set; } 
        public FinishingType Finishing { get; set; }
        public string? ProjectName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string BrokerId { get; set; } 
        public int BrokerPropertyCount { get; set; }
        public string? BrokerImage { get; set; }
        public string? BrokerTitle { get; set; }
        public string? BrokerDescription { get; set; }

        // أنواع الفيلا والمساحة
        public AreaType? AreaType { get; set; }
        public VillaCategory? VillaCategory { get; set; }
        public VillaType? VillaSubType { get; set; }

        // حقول الأدوار (Ground Floor)
        public int? GroundRooms { get; set; }
        public int? GroundBaths { get; set; }
        public int? GroundReception { get; set; }

        // حقول الأدوار (First Floor)
        public int? FirstRooms { get; set; }
        public int? FirstBaths { get; set; }
        public int? FirstReception { get; set; }

        // حقول الأدوار (Second Floor)
        public int? SecondRooms { get; set; }
        public int? SecondBaths { get; set; }
        public int? SecondReception { get; set; }

        // مرافق جديدة
        public bool? HasPool { get; set; }
        public bool? HasGarden { get; set; }
        public List<PhotoResponseDto> Photos { get; set; }

        public string BrokerName { get; set; } 
        public string BrokerPhone { get; set; }
        public bool IsApproved { get; set; }
        public string? RejectionReason { get; set; }
    }

    public class PropertyFilterDto
    {
        public string? SearchTerm { get; set; }
        public int? City { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public int? Rooms { get; set; }
        public int? PropertyType { get; set; }
        public int? ListingType { get; set; }
        public string? BrokerId { get; set; }
        public string? Code { get; set; }
        public int? BuildYear { get; set; }
        public int? Area { get; set; }
        public string? ProjectName { get; set; }

        // الحقول الجديدة (Ranges)
        public int? MinRooms { get; set; }
        public int? MaxRooms { get; set; }
        public int? MinBathrooms { get; set; }
        public int? MaxBathrooms { get; set; }
        public int? MinFloor { get; set; }
        public int? MaxFloor { get; set; }

    }

    public class PaymentPlanDto
    {
        public int InstallmentYears { get; set; }
        public decimal DownPayment { get; set; }
        public decimal QuarterInstallment { get; set; }
    }
}
