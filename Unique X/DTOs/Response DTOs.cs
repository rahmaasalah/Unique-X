namespace Unique_X.DTOs
{
    public class PhotoResponseDto
    {
        public string Url { get; set; }
        public bool IsMain { get; set; }
    }

    public class PropertyResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public int Area { get; set; }
        public int Rooms { get; set; }
        public int Bathrooms { get; set; }
        public string? Region { get; set; }
        public string? Address { get; set; }
        public string City { get; set; } 
        public string ListingType { get; set; }
        public string PropertyType { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<PhotoResponseDto> Photos { get; set; }

        public string BrokerName { get; set; } // اسم صاحب العقار
        public string BrokerPhone { get; set; } // رقم تليفونه للتواصل
    }

    public class PropertyFilterDto
    {
        public int? City { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public int? Rooms { get; set; }
        public int? PropertyType { get; set; }
    }
}
