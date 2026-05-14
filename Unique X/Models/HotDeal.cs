namespace Unique_X.Models
{
    public class HotDeal
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public Property Property { get; set; } // علاقة مع جدول العقارات
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}
