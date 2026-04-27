namespace Unique_X.DTOs.Dashboard
{
    public class AdminDashboardDto
    {
        public int TotalLeads { get; set; } // إجمالي العملاء في السيستم
        public int TotalClosedDeals { get; set; } // إجمالي الصفقات الناجحة
        public decimal TotalExpectedRevenue { get; set; } // الفلوس المتوقعة من كل الصفقات
        public List<BrokerPerformanceDto> BrokerPerformances { get; set; } // أداء كل بروكر
    }
}
