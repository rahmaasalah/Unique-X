namespace Unique_X.Models
{
    // طلب "Schedule Meeting" اللي بيبعته أي زائر من صفحة تفاصيل المشروع (blog-detail)
    public class ProjectMeetingRequest
    {
        public int Id { get; set; }

        public int BlogId { get; set; }
        public Blog Blog { get; set; }

        // بنخزن اسم المشروع هنا كمان (denormalized) عشان يظهر بسرعة في الأدمن من غير join
        public string? ProjectName { get; set; }

        public string FullName { get; set; }
        public string Phone { get; set; }
        public DateTime MeetingDate { get; set; }
        public string? Notes { get; set; }

        public bool IsContacted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}