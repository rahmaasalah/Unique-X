using Unique_X.Models;

namespace Unique_X.Models
{
    // 🟢 لما بروكر يضغط "Request Leads" في بروفايله ويملى المودال - بيتسجل طلب هنا
    // (مختلف تمامًا عن LeadRequest اللي هو تفضيلات عقار خاصة بـ Lead معين موجود بالفعل)
    public class BrokerLeadRequest
    {
        public int Id { get; set; }

        public string BrokerId { get; set; }
        public ApplicantUser Broker { get; set; }

        // 🟢 نفس فكرة مودال "Get Recommendation" بالظبط - Multi-select متسجلة كـ comma-separated
        public string? SelectedCities { get; set; }
        public string? ListingTypes { get; set; }
        public string? PropertyTypes { get; set; }

        public int? MinRooms { get; set; }
        public int? MaxRooms { get; set; }
        public int? MinBathrooms { get; set; }
        public int? MaxBathrooms { get; set; }
        public decimal? MinBudget { get; set; }
        public decimal? MaxBudget { get; set; }

        // Pending = لسه محتاج مراجعة الأدمن، Fulfilled = الأدمن حوّله عملاء وخلص الطلب
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}