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
        public string? DistanceFromLandmark { get; set; } // 4 نمرة من ابوقير
        public bool HasMasterRoom { get; set; }           // غرف ماستر
        public int ReceptionPieces { get; set; }          // ريسيبشن كم قطعة
        public string? View { get; set; }                 // الاطلالة (على الشارع)
        public int Floor { get; set; }                    // الدور
        public int TotalFloors { get; set; }               // عدد أدوار العقار
        public int ApartmentsPerFloor { get; set; }        // الدور كم شقة
        public int ElevatorsCount { get; set; }            // عدد الاسانسيرات
        public int BuildYear { get; set; }                 // سنة المباني
        public bool HasHotelEntrance { get; set; }        // مدخل فندقي
        public bool HasSecurity { get; set; }             // أمن وحراسة
        public bool IsFirstOwner { get; set; }            // أول مالك
        public bool IsLegalReconciled { get; set; }       // مدفوع تصالح
        public bool HasParking { get; set; }              // متاح جراج
        public decimal CommissionPercentage { get; set; } = 2.5m; // العمولة
        public bool HasBalcony { get; set; }
        public bool IsFurnished { get; set; }
        public string PaymentMethod { get; set; } // "Cash" or "Installment"
        public int? InstallmentYears { get; set; } // Nullable لأنه يظهر في حالة التقسيط فقط
        public string ListingType { get; set; }
        public string PropertyType { get; set; }
        public DeliveryStatus DeliveryStatus { get; set; } = DeliveryStatus.Ready;
        public int? DeliveryYear { get; set; } // Nullable لأنه يظهر فقط لو تحت الإنشاء
        public bool? IsLicensed { get; set; }        // هل الشقة مرخصة؟
        public bool? HasWaterMeter { get; set; }      // عداد مياه
        public bool? HasElectricityMeter { get; set; } // عداد كهرباء
        public bool? HasLandShare { get; set; }
        public bool? HasGasMeter { get; set; }
        public decimal? DownPayment { get; set; }        // المقدم
        public decimal? QuarterInstallment { get; set; } // القسط الربع سنوي
        public decimal? SecurityDeposit { get; set; }    // مبلغ التأمين (للإيجار)
        public decimal? MonthlyRent { get; set; }
        public string? Code { get; set; } // AR#123
        public FinishingType Finishing { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string BrokerId { get; set; } // ضروري جداً للربط
        public int BrokerPropertyCount { get; set; }
        public List<PhotoResponseDto> Photos { get; set; }

        public string BrokerName { get; set; } 
        public string BrokerPhone { get; set; } 
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
    }
}
