namespace Unique_X.Models
{
    public class Lead
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string? Email { get; set; }

        // ربط الـ Lead بالبروكر اللي ماسكه
        public string BrokerId { get; set; }
        public ApplicantUser Broker { get; set; } // Assuming your user class is ApplicationUser

        // ربط الـ Lead بالحملة الإعلانية
        public int? CampaignId { get; set; }
        public Campaign Campaign { get; set; }
        public string? ReferredBy { get; set; }

        public int LeadStatusId { get; set; }
        public LeadStatus Status { get; set; }

        public decimal? ExpectedRevenue { get; set; } // 14,000,000 LE
        public decimal? Probability { get; set; } // 100%
        public DateTime? ExpectedClosingDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
