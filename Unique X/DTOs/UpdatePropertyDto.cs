namespace Unique_X.DTOs
{
    public class UpdatePropertyDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public int? Area { get; set; }
        public int? Rooms { get; set; }
        public int? Bathrooms { get; set; }
        public int? City { get; set; }
        public string? Region { get; set; }
        public string? Address { get; set; }
        public int? ListingType { get; set; }
        public int? PropertyType { get; set; }
        public List<IFormFile>? Photos { get; set; }
    }
}
