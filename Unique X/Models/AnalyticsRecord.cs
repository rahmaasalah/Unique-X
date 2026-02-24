namespace Unique_X.Models
{
    public class AnalyticsRecord
    {
        public int Id { get; set; }
        public string ActionType { get; set; } // "WhatsAppClick", "CallClick", "HomeView"
        public int? PropertyId { get; set; }    // لو الضغطة كانت على عقار معين
        public string? UserId { get; set; }     // لو مسجل دخول، نعرف هو مين
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
