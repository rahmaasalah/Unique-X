namespace Unique_X.DTOs.CRM
{
    public class CreateLeadDto
    {
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string? Email { get; set; }
        public string BrokerId { get; set; } // الأدمن بيختار البروكر
        public int? CampaignId { get; set; }
        public int LeadStatusId { get; set; }

        // بيانات الـ Request المبدئية
        public string PropertyType { get; set; }
        public string Purpose { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentMethod { get; set; }
        public string PreferredLocation { get; set; }
        public string Notes { get; set; }
    }
}
