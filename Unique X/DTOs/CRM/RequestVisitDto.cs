namespace Unique_X.DTOs.CRM
{
    public class RequestVisitDto
    {
        public int PropertyId { get; set; }
        public string ClientName { get; set; }
        public string ClientPhone { get; set; }
        public string? ClientEmail { get; set; }
        public DateTime VisitDate { get; set; }
        public string? Notes { get; set; }
    }
}
