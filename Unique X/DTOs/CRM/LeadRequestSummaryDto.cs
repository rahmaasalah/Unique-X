namespace Unique_X.DTOs.CRM
{
    // 🟢 ملخص طلب العميل (Request) + الوحدة اللي استفسر عنها (لو جه من Call/WhatsApp/Visit على وحدة)
    // بيتعرض في جدولي Transfer Leads و Pending Clients في الـ CRM Dashboard
    public class LeadRequestSummaryDto
    {
        // Unit = العميل جه من ضغطة Call/WhatsApp/Visit على وحدة | Recommendation = من مودال Get Recommendation | Other = أي مصدر تاني
        public string Source { get; set; } = "Other";

        public bool IsFromUnit { get; set; }

        // true لو البروكر غيّر حاجة في الـ Request بعد ما العميل جه من وحدة (يعني التغييرات هي اللي تتعرض بدل بيانات الوحدة)
        public bool IsRequestEdited { get; set; }

        public List<LeadUnitSummaryDto> Units { get; set; } = new();

        public LeadRequestInfoDto? Request { get; set; }
    }

    public class LeadUnitSummaryDto
    {
        public int Id { get; set; }
        public string? Code { get; set; }
        public decimal Price { get; set; }
        public string? Location { get; set; }
        public string? PropertyType { get; set; }
        public string? ListingType { get; set; }
        public int Rooms { get; set; }
        public int Bathrooms { get; set; }
        public int Area { get; set; }
        public int Floor { get; set; }
        public string? Finishing { get; set; }
        public int? DeliveryYear { get; set; }
    }

    public class LeadRequestInfoDto
    {
        public string? PropertyType { get; set; }   // Comma-separated
        public string? Purpose { get; set; }        // Comma-separated
        public string? Cities { get; set; }
        public string? Regions { get; set; }
        public string? Projects { get; set; }
        public decimal? MinBudget { get; set; }
        public decimal? MaxBudget { get; set; }
        public decimal? TotalAmount { get; set; }
        public int? MinRooms { get; set; }
        public int? MaxRooms { get; set; }
        public int? MinBathrooms { get; set; }
        public int? MaxBathrooms { get; set; }
        public string? PaymentMethod { get; set; }
        public decimal? DownPayment { get; set; }
        public int? InstallmentYears { get; set; }
    }
}