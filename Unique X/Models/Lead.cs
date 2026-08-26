namespace Unique_X.Models
{
    public class Lead
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string? Email { get; set; }

        // ربط الـ Lead بالبروكر اللي ماسكه
        public string BrokerId { get; set; }
        public ApplicantUser Broker { get; set; } // Assuming your user class is ApplicationUser

        // ربط الـ Lead بالحملة الإعلانية
        public int? CampaignId { get; set; }
        public Campaign Campaign { get; set; }
        public string? ReferredBy { get; set; }
        public string? GeneralFeedback { get; set; }

        public int LeadStatusId { get; set; }
        public LeadStatus Status { get; set; }

        public decimal? ExpectedRevenue { get; set; } // 14,000,000 LE
        public decimal? Probability { get; set; } // 100%
        public DateTime? ExpectedClosingDate { get; set; }

        public string? CampaignSource { get; set; } // Facebook, Google, etc.
        public string? CampaignName { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public string? LastActionBy { get; set; } // "broker" or "admin"


        public bool IsDuplicate { get; set; } = false; // هل العميل ده متكرر؟
        public bool IsApprovedDuplicate { get; set; } = true; // هل الأدمن وافق على التكرار ده؟
        public bool IsRejectedDuplicate { get; set; } // هل الأدمن رفضه

        public string? OriginalBrokerName { get; set; }
        // اسم البروكر اللي طلب إضافة العميل للمرة التانية
        public string? DuplicateRequestedByBrokerName { get; set; }

        // ============================================================
        // 🟢 نظام السحب التلقائي (Auto Reassignment) - Late/Too Late
        // ============================================================

        // هل العميل ده اتسحب من البروكر بتاعه بسبب عدم الرد لمدة 72 ساعة؟
        public bool IsUnassigned { get; set; } = false;

        // معرف البروكر اللي اتسحب منه العميل (عشان نعرض اسم العميل عنده كـ "Disappeared")
        public string? PreviousBrokerId { get; set; }

        // إمتى اتسحب العميل بالظبط
        public DateTime? UnassignedAt { get; set; }

        // 🟢 نقطة تصفير عداد الفيدباك: لما البروكر الجديد ياخد العميل، بنسجل الوقت هنا
        // وعداد الفيدباك (في الفرونت) بيحسب بس الفيدباكات اللي اتضافت بعد التاريخ ده
        // (الفيدباكات القديمة بتفضل موجودة في GeneralFeedback كتاريخ، بس مش بتتحسب في العداد)
        public DateTime? FeedbackCounterResetAt { get; set; }
    }
}