namespace Unique_X.DTOs.CRM
{
    public class VisitResponseDto
    {
        public int Id { get; set; }
        public int LeadId { get; set; }
        public string LeadName { get; set; }
        public string LeadPhone { get; set; }
        public int? PropertyId { get; set; }
        public DateTime VisitDate { get; set; }
        public string Location { get; set; }
        public string Feedback { get; set; }
        public bool IsCompleted { get; set; }
    }
}
