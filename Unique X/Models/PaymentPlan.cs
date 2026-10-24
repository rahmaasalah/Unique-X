namespace Unique_X.Models
{
    public class PaymentPlan
    {
        public int Id { get; set; }
        public decimal InstallmentYears { get; set; }

        public decimal DownPayment { get; set; }
        public decimal QuarterInstallment { get; set; }
        public string Frequency { get; set; }

        // 🟢 Back-Loaded Payment Plan (Frequency = "Back-Loaded"):
        // القسط السنوي الكلي (QuarterInstallment) بيتقسم لجزء شهري (11 شهر في السنة) وجزء سنوي بالنسب دي
        public decimal? MonthlyPercentage { get; set; }
        public decimal? AnnualPercentage { get; set; }
        public decimal? MonthlyAmount { get; set; }
        public decimal? AnnualAmount { get; set; }

        // العلاقة مع العقار (Foreign Key)
        public int PropertyId { get; set; }
        public Property Property { get; set; }
    }
}