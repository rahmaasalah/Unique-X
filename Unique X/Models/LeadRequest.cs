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
    }
}
