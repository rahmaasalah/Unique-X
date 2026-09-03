namespace Unique_X.DTOs
{
    public class CreateJobApplicationDto
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? City { get; set; }
        public string HasJob { get; set; } = string.Empty;
        public string? HasJobOther { get; set; }
        public string? WorkPlace { get; set; }
        public string HasLaptop { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string EnglishLevel { get; set; } = string.Empty;
        public string CrmTools { get; set; } = string.Empty;
        public string? CrmToolsOther { get; set; }
        public string? PastExperiences { get; set; }
        public string? RealEstateBackground { get; set; }
        public string CompanyType { get; set; } = string.Empty;
        public string ZoneWorkedOn { get; set; } = string.Empty;
        public string ProjectPreparation { get; set; } = string.Empty;
        public string VisitSite { get; set; } = string.Empty;
        public string DealsClosing { get; set; } = string.Empty;
        public string SalesLastQuarter { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public IFormFile? CvFile { get; set; }

        // ============================================================
        // 🟢 حقول جديدة - نظام الأسئلة الديناميكية لكل وظيفة (8 فورمات مختلفة)
        // ============================================================
        public string? WhatsAppNumber { get; set; }
        public string? Email { get; set; }
        public string? Age { get; set; }
        public string? EmploymentStatus { get; set; } // Employed / Unemployed / Freelancer / Student / Other
        public string? HowHeard { get; set; }

        // 🟢 كل إجابات الأسئلة الخاصة بالوظيفة، كـ JSON: { "السؤال": "الإجابة" }
        public string? AnswersJson { get; set; }
    }
}