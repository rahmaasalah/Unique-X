namespace Unique_X.DTOs
{
    // اللي بيتبعت من زرار "Schedule Meeting" في صفحة تفاصيل المشروع
    public class ScheduleMeetingDto
    {
        public string FullName { get; set; }
        public string Phone { get; set; }
        public DateTime MeetingDate { get; set; }
        public string? Notes { get; set; }
    }

    // اللي بيتعرض في تاب "Projects Meetings" بالأدمن داشبورد
    public class ProjectMeetingResponseDto
    {
        public int Id { get; set; }
        public int BlogId { get; set; }
        public string? ProjectName { get; set; }
        public string FullName { get; set; }
        public string Phone { get; set; }
        public DateTime MeetingDate { get; set; }
        public string? Notes { get; set; }
        public bool IsContacted { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}