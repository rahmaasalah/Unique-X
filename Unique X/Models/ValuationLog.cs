using static Unique_X.Models.PropEnums;

namespace Unique_X.Valuation
{
    // جدول جديد بيسجل كل عملية تقييم (محتاج Migration)
    public class ValuationLog
    {
        public int Id { get; set; }
        public City City { get; set; }
        public string Region { get; set; } = "";
        public PropertyType PropertyType { get; set; }
        public int Area { get; set; }
        public FinishingType Finishing { get; set; }
        public decimal EstimatedTotalMid { get; set; }
        public string Confidence { get; set; } = "";
        public int ComparablesCount { get; set; }
        public string? RequestJson { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}