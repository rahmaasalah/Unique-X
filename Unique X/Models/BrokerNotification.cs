namespace Unique_X.Models
{
    // ============================================================
    // 🟢 إشعارات دائمة للبروكر (بتفضل مخزنة في الداتابيز لحد ما تتقرا)
    // أول استخدام ليها: تنبيه البروكر إن عميل اتسحب منه بسبب عدم اتخاذ أي أكشن لـ 48 ساعة
    // ممكن نستخدمها لأنواع تانية من الإشعارات بعدين (زي Type بيوضح)
    // ============================================================
    public class BrokerNotification
    {
        public int Id { get; set; }

        public string BrokerId { get; set; }

        // ممكن تبقى null لو الإشعار مش مرتبط بعميل معين
        public int? LeadId { get; set; }

        public string Message { get; set; }

        // "LeadRemoved" دلوقتي - ممكن نضيف أنواع تانية بعدين (زي "LeadTransferred", "NewLead"..)
        public string Type { get; set; } = "LeadRemoved";

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}