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
        public DateTime DueDate { get; set; }
    }
}
