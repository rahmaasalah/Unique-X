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
        public decimal? TotalAmount { get; set; }
        public int? ZoneId { get; set; }
        public string? SelectedRegions { get; set; } // هيتخزن كنص مفصول بفاصلة
        public string? SelectedProjects { get; set; } // هيتخزن كنص مفصول بفاصلة
        public decimal? DownPayment { get; set; }
        public int? InstallmentYears { get; set; }
        // الحقل ده هيخزن أرقام العقارات اللي البروكر اقترحها (داس عليها) مفصولة بفاصلة
        public string? ProposedPropertyIds { get; set; }
    }
}
