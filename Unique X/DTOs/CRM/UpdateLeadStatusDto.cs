namespace Unique_X.DTOs.CRM
{
    public class UpdateLeadStatusDto
    {
        public int NewStatusId { get; set; }
        public string BrokerId { get; set; } // الـ ID بتاع الشخص اللي بيغير الحالة
        public string? Notes { get; set; }
    }
}
