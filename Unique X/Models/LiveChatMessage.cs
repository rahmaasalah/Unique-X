using System.ComponentModel.DataAnnotations;

namespace Unique_X.Models
{
    // رسالة في الـ Live Chat العام (أي حد يقدر يبعت ويشوف من غير تسجيل دخول)
    public class LiveChatMessage
    {
        public long Id { get; set; }

        // لو المرسل مسجل دخول (من غير FK عمدًا عشان مسح يوزر ميمسحش/يبوظ الرسائل)
        [MaxLength(450)]
        public string? SenderUserId { get; set; }

        [MaxLength(60)]
        public string SenderName { get; set; } = "Guest";

        public string? SenderImage { get; set; }

        // معرّف عشوائي بيتخزن في متصفح الزائر عشان رسايله تظهر "بتاعتي" عنده
        [MaxLength(40)]
        public string? GuestKey { get; set; }

        [MaxLength(1000)]
        public string? Text { get; set; }

        public string? ImageUrl { get; set; }

        public int? PropertyId { get; set; }

        // طلب عميل متشارك من البروكر (نسخة آمنة JSON من غير بيانات شخصية)
        public string? RequestJson { get; set; }

        public bool IsPinned { get; set; }
        public DateTime? PinnedAt { get; set; }

        [MaxLength(60)]
        public string? PinnedByName { get; set; }

        public bool IsDeleted { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}