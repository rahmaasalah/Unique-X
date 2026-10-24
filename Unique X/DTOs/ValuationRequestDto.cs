using System.ComponentModel.DataAnnotations;
using static Unique_X.Models.PropEnums;

namespace Unique_X.DTOs
{
    // البيانات اللي المالك بيدخلها في الفورم
    public class ValuationRequestDto : IValidatableObject
    {
        [Required] public City City { get; set; }

        [Required, MaxLength(100)]
        public string Region { get; set; } = "";

        [Required] public PropertyType PropertyType { get; set; }

        [Range(20, 5000)]
        public int Area { get; set; }

        [Required] public FinishingType Finishing { get; set; }

        public DeliveryStatus DeliveryStatus { get; set; } = DeliveryStatus.Ready;

        // سنة التسليم: مطلوبة فقط لو الوحدة تحت الإنشاء، ولازم تكون أكبر من السنة الحالية
        public int? DeliveryYear { get; set; }

        [Range(0, 100)] public int Floor { get; set; }

        // عدد أدوار البناية (0 = مش عارف)
        [Range(0, 100)] public int TotalFloors { get; set; }

        // سنة البناء الفعلية (مثلاً 2015). 0 = مش عارف
        [Range(0, 2100)] public int BuildYear { get; set; }

        [Range(0, 20)] public int Rooms { get; set; }
        [Range(0, 20)] public int Bathrooms { get; set; }

        public bool HasElevator { get; set; }
        public bool HasParking { get; set; }
        public bool HasSecurity { get; set; }
        public bool HasBalcony { get; set; }
        public bool IsLicensed { get; set; }
        public bool HasGarden { get; set; }
        public bool HasPool { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            int year = DateTime.UtcNow.Year;

            if (DeliveryStatus != DeliveryStatus.Ready &&
                (DeliveryYear == null || DeliveryYear <= year || DeliveryYear > year + 15))
            {
                yield return new ValidationResult(
                    $"Delivery year must be between {year + 1} and {year + 15} for units under construction.",
                    new[] { nameof(DeliveryYear) });
            }

            if (TotalFloors > 0 && Floor > TotalFloors)
            {
                yield return new ValidationResult(
                    "Floor cannot be higher than the number of building floors.",
                    new[] { nameof(Floor) });
            }
        }
    }
}