namespace Unique_X.Models
{
    public class LeadFavorite
    {
        public int Id { get; set; }
        public string BrokerId { get; set; } = string.Empty;
        public string BrokerName { get; set; } = string.Empty;
        public int LeadId { get; set; }
        public Lead Lead { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
