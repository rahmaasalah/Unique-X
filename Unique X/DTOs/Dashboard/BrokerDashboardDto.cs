using Unique_X.DTOs.CRM;

namespace Unique_X.DTOs.Dashboard
{
    public class BrokerDashboardDto
    {
        public int TotalMyLeads { get; set; }
        public int MyClosedDeals { get; set; }
        public decimal MyExpectedRevenue { get; set; }
        public int MyPendingTasksToday { get; set; } // المهام المطلوبة منه النهاردة
        public List<BrokerTaskDto> PendingTasksList { get; set; }
        public List<VisitResponseDto> PendingVisitsList { get; set; }
    }

    public class BrokerTaskDto
    {
        public int Id { get; set; }
        public int LeadId { get; set; }
        public string LeadName { get; set; }
        public string ActivityType { get; set; }
        public string Summary { get; set; }
        public bool IsDone { get; set; }
        public string Status { get; set; }

        public DateTime DueDate { get; set; }
        public string? PropertyCode { get; set; }
        public string? PropertyName { get; set; }
        public string? BrokerPhone { get; set; }
        public int ZoneId { get; set; }
        public string ListingType { get; set; }
        public string? Region { get; set; }
        public string? Project { get; set; }
        public string? Notes { get; set; }
    }
}
