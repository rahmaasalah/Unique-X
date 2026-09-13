namespace Unique_X.DTOs.CRM
{
    public class BrokerLeadRequestResponseDto
    {
        public int Id { get; set; }
        public string BrokerId { get; set; }
        public string BrokerName { get; set; }

        public string? SelectedCities { get; set; }
        public string? ListingTypes { get; set; }
        public string? PropertyTypes { get; set; }

        public int? MinRooms { get; set; }
        public int? MaxRooms { get; set; }
        public int? MinBathrooms { get; set; }
        public int? MaxBathrooms { get; set; }
        public decimal? MinBudget { get; set; }
        public decimal? MaxBudget { get; set; }

        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}