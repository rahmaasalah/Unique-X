namespace Unique_X.Models
{
    public class JobPosting
    {
        public int Id { get; set; }
        public string JobTitle { get; set; }
        public string JobSummary { get; set; }
        public string KeyResponsibilities { get; set; }
        public string Qualifications { get; set; }
        public string KPIs { get; set; }

        // 🟢 الأدمن يقدر يقفل الوظيفة (تختفي من الموقع) من غير ما يمسحها نهائي
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}