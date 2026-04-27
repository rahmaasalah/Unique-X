namespace Unique_X.DTOs.CRM
{
    public class CreateActivityDto
    {
        public int LeadId { get; set; }
        public string ActivityType { get; set; } // Call, Meeting, Email
        public string Summary { get; set; }
        public DateTime DueDate { get; set; }
        public string AssignedToId { get; set; }
        public string? Notes { get; set; }
    }
}
