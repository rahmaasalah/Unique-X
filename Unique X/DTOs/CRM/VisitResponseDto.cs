namespace Unique_X.DTOs.CRM
{
    public class VisitResponseDto
    {
        public int Id { get; set; }
        public int LeadId { get; set; }
        public string LeadName { get; set; }
        public string LeadPhone { get; set; }
        public DateTime VisitDate { get; set; }
        public string Location { get; set; }
        public string Feedback { get; set; }
        public bool IsCompleted { get; set; }
        public string? PropertyCode { get; set; }
        public string? PropertyName { get; set; }
        public string? BrokerPhone { get; set; }
        public int ZoneId { get; set; }
        public string? VisitType { get; set; }
        public string? Notes { get; set; }
        public string Status { get; set; }
        public string ListingType { get; set; }
        public string? Region { get; set; }
        public string? Project { get; set; }
    }
}
