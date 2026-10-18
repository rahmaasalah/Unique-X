using System.ComponentModel.DataAnnotations.Schema;

namespace Unique_X.Models
{
    // 🟢 الوحدات اللي البروكر عرضها فعلاً على العميل (Lead) - بتظهر في كارت "Shown Properties" في صفحة الـ Lead
    // الفيدباك (رأي العميل) بيتخزن كـ Review على الوحدة، و ReviewId هو الربط (من غير Foreign Key عشان نتفادى Multiple cascade paths)
    public class LeadShownProperty
    {
        public int Id { get; set; }

        public int LeadId { get; set; }
        public Lead Lead { get; set; } = null!;

        public int PropertyId { get; set; }
        [ForeignKey(nameof(PropertyId))]
        public Property Property { get; set; } = null!;

        public string? ShownByBrokerId { get; set; }
        public DateTime ShownAt { get; set; } = DateTime.UtcNow;

        public int? ReviewId { get; set; }
    }
}