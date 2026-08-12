namespace Unique_X.Models
{
    // نفس فكرة HotDeal بالظبط - قائمة عقارات يختارها الأدمن يدويًا لعرضها في قسم
    // "Recommended to Visit" في الهوم (تحت Hot Deals مباشرة)
    public class RecommendedVisit
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public Property Property { get; set; } // علاقة مع جدول العقارات
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}