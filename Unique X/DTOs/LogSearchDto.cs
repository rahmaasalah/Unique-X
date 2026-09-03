namespace Unique_X.DTOs
{
    public class LogSearchDto
    {
        public string? SearchTerm { get; set; }
        public string? ProjectName { get; set; }
        public int? City { get; set; }
        public int? PropertyType { get; set; }
        public int? ListingType { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public decimal? MinPricePerMeter { get; set; }
        public decimal? MaxPricePerMeter { get; set; }
        public int? MinRooms { get; set; }
        public int? MaxRooms { get; set; }
        public int? MinBathrooms { get; set; }
        public int? MaxBathrooms { get; set; }
        public int? MinFloor { get; set; }
        public int? MaxFloor { get; set; }
    }
}