using System.Collections.Generic;

namespace Unique_X.DTOs.CRM
{
    public class RecommendationLeadDto
    {
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string? Email { get; set; }

        // 🟢 كودات زي ما بتيجي من المودال - هنحولها لأسماء واضحة قبل التخزين
        public List<string> Cities { get; set; } = new();
        public List<string> ListingTypes { get; set; } = new();
        public List<string> PropertyTypes { get; set; } = new();

        public int? MinRooms { get; set; }
        public int? MaxRooms { get; set; }
        public int? MinBathrooms { get; set; }
        public int? MaxBathrooms { get; set; }

        public decimal? MinBudget { get; set; }
        public decimal? MaxBudget { get; set; }
    }
}