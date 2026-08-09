namespace Unique_X.Models
{
    // 🟢 طلب حجز ميعاد من صفحة تفاصيل اللونش (Schedule Meeting) — نفس فكرة ProjectMeetingRequest بتاع الـ Blogs
    public class LaunchMeetingRequest
    {
        public int Id { get; set; }
        public int LaunchId { get; set; }
        public string? ProjectName { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public DateTime MeetingDate { get; set; }
        public string? Notes { get; set; }
        public bool IsContacted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}