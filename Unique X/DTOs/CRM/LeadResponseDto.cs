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
        public int StatusId { get; set; }
        public string PropertyType { get; set; }
        public string Purpose { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
