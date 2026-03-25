namespace Unique_X.Models
{
    public class PaymentPlan
    {
        public int Id { get; set; }
        public int InstallmentYears { get; set; }

        public decimal DownPayment { get; set; }
        public decimal QuarterInstallment { get; set; }

        // العلاقة مع العقار (Foreign Key)
        public int PropertyId { get; set; }
        public Property Property { get; set; }
    }
}