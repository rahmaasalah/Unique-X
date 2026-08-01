namespace Unique_X.DTOs.CRM
{
    public class RequestVisitDto
    {
        public int PropertyId { get; set; }
        public string ClientName { get; set; }
        public string ClientPhone { get; set; } // رقم الحساب المسجل - ده اللي بيتحدد بيه هل العميل Lead موجود قبل كده
        public string? ContactPhone { get; set; } // رقم تواصل اختياري خاص بالزيارة دي بس (اللي كتبه في المودال)
        public string? ClientEmail { get; set; }
        public DateTime VisitDate { get; set; }
        public string? VisitType { get; set; }
        public string? Notes { get; set; }
    }
}