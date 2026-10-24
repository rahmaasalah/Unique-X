namespace Unique_X.DTOs
{
    // النتيجة اللي بترجع للفرونت
    public class ValuationResult
    {
        public bool Success { get; set; }
        public string? Message { get; set; }

        public decimal PricePerMeterLow { get; set; }
        public decimal PricePerMeterMid { get; set; }
        public decimal PricePerMeterHigh { get; set; }

        public decimal TotalLow { get; set; }
        public decimal TotalMid { get; set; }
        public decimal TotalHigh { get; set; }

        public int ComparablesCount { get; set; }

        // High | Medium | Low
        public string Confidence { get; set; } = "Low";

        // سبب/أساس التقدير بالعربي، يتعرض للمستخدم
        public string Basis { get; set; } = "";

        public string Disclaimer { get; set; } =
            "This is an indicative estimate based on listings on our platform. It is not an official appraisal.";
    }
}