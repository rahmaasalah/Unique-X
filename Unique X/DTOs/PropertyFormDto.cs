using System.ComponentModel.DataAnnotations;

namespace Unique_X.DTOs
{
    public class PropertyFormDto
    {
        [Required, MaxLength(200)]
        public string? Title { get; set; }

        [Required]
        public string? Description { get; set; }

        [Required]
        public decimal Price { get; set; }

        public int Area { get; set; }
        public int Rooms { get; set; }
        public int Bathrooms { get; set; }

        [Required]
        public string? City { get; set; }
        public string? Region { get; set; }
        public string? Address { get; set; }

        // 0 = Sale, 1 = Rent
        public int ListingType { get; set; }

        // 0 = Apartment, 1 = Villa, etc.
        public int PropertyType { get; set; }

        // قائمة الصور التي سيرفعها البروكر
        public List<IFormFile>? Photos { get; set; }
    }
}
