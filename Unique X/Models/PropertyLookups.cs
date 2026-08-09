using static Unique_X.Models.PropEnums;

namespace Unique_X.Models
{
    // نوع المشروع: هل هو مشروع أولي (Primary) ولا مشروع إعادة بيع (Resale)
    public enum ProjectListingType
    {
        Primary = 0,
        Resale = 1
    }

    // جدول المطورين - بيحل محل الـ Dictionary الهاردكودد PrimaryAndDeveloperCodes
    public class Developer
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty; // الكود اللي بيتحط في كود العقار (مثلاً PH)
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    // جدول المشاريع (Primary + Resale) - بيحل محل PrimaryAndDeveloperCodes (لجزء الاسم) و ResaleProjectIds
    public class Project
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty; // Primary: حروف زي "PH" / Resale: رقم زي "1"
        public ProjectListingType Type { get; set; }
        public City City { get; set; }
        public string? Region { get; set; } // مطلوب للمشاريع الـ Primary بس (المنطقة اللي المشروع تابعلها)
        public int? DeveloperId { get; set; }
        public Developer? Developer { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    // جدول المناطق (Regions) - بيحل محل ResaleZoneIds وقايمة regionsMapping الهاردكودد في الفرونت
    public class Region
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ZoneCode { get; set; } // كود المنطقة المستخدم في توليد كود العقار (لو موجود)
        public City City { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}