namespace Unique_X.DTOs.CRM
{
    public class CreateVisitDto
    {
        public int LeadId { get; set; }
        public string BrokerId { get; set; }
        public DateTime VisitDate { get; set; }
        public string Location { get; set; }
        public string? PropertyCode { get; set; }
        public string? PropertyName { get; set; }
        public string? BrokerPhone { get; set; }
        public int ZoneId { get; set; }
        public string? Notes { get; set; }
        public string ListingType { get; set; }
        public string? Region { get; set; }
        public string? Project { get; set; }
    }
}
