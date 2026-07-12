namespace Unique_X.Models
{
    public class VisitList
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int PropertyId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Property Property { get; set; } = null!;
    }
}
