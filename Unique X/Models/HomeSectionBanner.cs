namespace Unique_X.Models
{
    public class HomeSectionBanner
    {
        public int Id { get; set; }
        // "explore-home" أو "add-property"
        public string Key { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string PublicId { get; set; } = string.Empty;
    }
}
