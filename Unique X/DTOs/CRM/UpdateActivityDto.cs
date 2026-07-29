namespace Unique_X.DTOs.CRM
{
    public class UpdateActivityDto
    {
        public string ActivityType { get; set; }
        public string Summary { get; set; }
        public DateTime DueDate { get; set; }
        public string? Notes { get; set; }

        // بيتبعتوا بس لو الميعاد فات (Completed/Cancelled/Rescheduled)
        public string? Status { get; set; }
        public string? Feedback { get; set; }

    }
}
