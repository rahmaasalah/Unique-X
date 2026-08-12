using System.ComponentModel.DataAnnotations;

namespace Unique_X.Models
{
    // 🟢 "Blogs" اللي في واجهة الأدمن والموقع — سميناها Article جوه الكود
    // عشان في تعارض مع الـ Blog الموجودة أصلاً (وهي في الحقيقة بتاعة Projects)
    public class Article
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        public string? Excerpt { get; set; } // ملخص قصير يظهر في صفحة قائمة المقالات

        public string CoverImageUrl { get; set; } = string.Empty;
        public string? CoverCaption { get; set; } // النص الصغير تحت الصورة الرئيسية

        public string WrittenBy { get; set; } = string.Empty;
        public DateTime PublishedAt { get; set; } = DateTime.UtcNow;

        public bool IsPublished { get; set; } = true;
        public int DisplayOrder { get; set; }

        // 🔸 مؤجلة دلوقتي - مجرد مكان في الداتابيز لحد ما تتفعل (ملف صوت أو TTS)
        public string? VoiceUrl { get; set; }

        // ===== 5 بانرات إعلانية بمواضع ثابتة جوه المقال =====
        // كل واحد بيقبل صورة/GIF/فيديو (mp4) + لينك تحويل عند الضغط

        // Ad1: أعلى المقال، قبل العنوان
        public string? Ad1Url { get; set; }
        public string? Ad1Link { get; set; }

        // Ad2: بعد Written by / Date (وقبل بداية المحتوى)
        public string? Ad2Url { get; set; }
        public string? Ad2Link { get; set; }

        // Ad3: مباشرة بعد Ad2
        public string? Ad3Url { get; set; }
        public string? Ad3Link { get; set; }

        // Ad4: بعد كل أقسام المحتوى (Headlines/Text)
        public string? Ad4Url { get; set; }
        public string? Ad4Link { get; set; }

        // Ad5: قرب آخر المقال، بعد صف المشاركة التاني وقبل الكلمات المفتاحية
        public string? Ad5Url { get; set; }
        public string? Ad5Link { get; set; }

        // عناوين وفقرات المقال - عدد مفتوح [{ "headline": "...", "text": "..." }]
        public string? SectionsJson { get; set; }

        // كلمات مفتاحية قابلة للضغط - ["كلمة1", "كلمة2"]
        public string? KeywordsJson { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}