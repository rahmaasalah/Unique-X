namespace Unique_X.Models
{
    // نفس فكرة FinancialFile بالظبط - بس ده خاص بأسعار المتر للمشاريع
    // (Resale + Primary) عبر أكتر من سنة، وبيتعرض كـ chart في صفحة تفاصيل المشروع
    public class ProjectFinancialFile
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public byte[] FileData { get; set; } = Array.Empty<byte>();
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}