namespace Unique_X.DTOs.CRM
{
    public class LeadResponseDto
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string BrokerName { get; set; } // هنرجع اسم البروكر مش الـ ID
        public string StatusName { get; set; } // هنرجع اسم الحالة 
        public string CampaignName { get; set; }
        public string ZoneName { get; set; }
        public int StatusId { get; set; }
        public decimal TotalAmount { get; set; }
        public string PropertyType { get; set; }
        public string PreferredLocation { get; set; }
        public string Purpose { get; set; }
        public string CampaignSource { get; set; } // مصدر الحملة
        public string ReferredBy { get; set; } // كود البروكر
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; } // 👈 ده اللي هيحل مشكلة التاريخ

        public string PaymentMethod { get; set; }
        public decimal? DownPayment { get; set; }
        public int? InstallmentYears { get; set; }
    }
}
