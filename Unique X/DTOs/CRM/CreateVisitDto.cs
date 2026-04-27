namespace Unique_X.DTOs.CRM
{
    public class CreateVisitDto
    {
        public int LeadId { get; set; }
        public string BrokerId { get; set; }
        public int? PropertyId { get; set; } // اختياري لو الزيارة لسه مش محددة بوحدة معينة
        public DateTime VisitDate { get; set; }
        public string Location { get; set; }
    }
}
