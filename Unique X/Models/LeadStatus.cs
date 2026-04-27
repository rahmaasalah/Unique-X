namespace Unique_X.Models
{
    public class LeadStatus
    {
        public int Id { get; set; }
        public string Name { get; set; } // e.g., "Visit scheduled"
        public string Category { get; set; } // Open, Closed-Won, Closed-Lost
    }
}
