namespace Unique_X.Models
{
    public class LeadRequest
    {
        public int Id { get; set; }
        public int LeadId { get; set; }
        public Lead Lead { get; set; }

        public string PropertyType { get; set; } // 🟢 بقت Multi-select: Comma-separated زي "Apartment,Villa"
        public string Purpose { get; set; } // 🟢 بقت Multi-select: Comma-separated زي "Resale,Rent"
        public decimal MinBudget { get; set; }
        public decimal MaxBudget { get; set; }
        public string PaymentMethod { get; set; } // Cash, Installments
        public string PreferredLocation { get; set; }
        public string Notes { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? QuarterlyInstallment { get; set; }

        public int? ZoneId { get; set; }
        public string? SelectedRegions { get; set; }
        public string? SelectedProjects { get; set; }
        public decimal? DownPayment { get; set; }
        public int? InstallmentYears { get; set; }
        public string? ProposedPropertyIds { get; set; }

        // ============================================================
        // 🟢 حقول جديدة من مودال "Get Recommendation" في الهوم
        // ============================================================
        // 🟢 المدن المختارة - Comma-separated زي SelectedRegions بالظبط (مثال: "Cairo,Alexandria")
        public string? SelectedCities { get; set; }

        public int? MinRooms { get; set; }
        public int? MaxRooms { get; set; }
        public int? MinBathrooms { get; set; }
        public int? MaxBathrooms { get; set; }
    }
}