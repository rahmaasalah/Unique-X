namespace Unique_X.Models
{
    public class LeadRequest
    {
        public int Id { get; set; }
        public int LeadId { get; set; }
        public Lead Lead { get; set; }

        public string PropertyType { get; set; } // Apartment, Villa, Chalet...
        public string Purpose { get; set; } // Resale, Rent, Primary
        public decimal MinBudget { get; set; }
        public decimal MaxBudget { get; set; }
        public string PaymentMethod { get; set; } // Cash, Installments
        public string PreferredLocation { get; set; } // المنطقة المفضلة
        public string Notes { get; set; } // أي تفاصيل إضافية

        public string? UnitType { get; set; }
        public string? ZoneInterested { get; set; }
        public string? Floor { get; set; }
        public string? BuildingDate { get; set; }
        public string? Compound { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? DpAmount { get; set; } // Down Payment
        public decimal? InstallmentAmount { get; set; }
    }
}
