namespace Unique_X.DTOs.CRM
{
    public class UpdateLeadDetailsDto
    {
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string? Email { get; set; }
        public int LeadStatusId { get; set; }
        public int? CampaignId { get; set; }
        public string? ReferredBy { get; set; }

        // الحقول العقارية القديمة
        public string PropertyType { get; set; }
        public string Purpose { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentMethod { get; set; }
        public int? ZoneId { get; set; }
        public string? SelectedRegions { get; set; }
        public string? SelectedProjects { get; set; }
        public decimal? DownPayment { get; set; }
        public int? InstallmentYears { get; set; }
        public string PreferredLocation { get; set; }
        public string Notes { get; set; }
    }
}

