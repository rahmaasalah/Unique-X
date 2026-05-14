namespace Unique_X.DTOs.CRM
{
    public class CreateLeadDto
    {
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string? Email { get; set; }
        public string BrokerId { get; set; } // الأدمن بيختار البروكر
        public string? CampaignSource { get; set; }
        public string? CampaignName { get; set; }
        public int LeadStatusId { get; set; }
        public string? ReferredBy { get; set; }

        // بيانات الـ Request المبدئية
        public string PropertyType { get; set; }
        public string Purpose { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentMethod { get; set; }
        public string PreferredLocation { get; set; }
        public string Notes { get; set; }
        public int? ZoneId { get; set; }
        public string? SelectedRegions { get; set; }
        public string? SelectedProjects { get; set; }
        public decimal? DownPayment { get; set; }
        public int? InstallmentYears { get; set; }
    }
}
