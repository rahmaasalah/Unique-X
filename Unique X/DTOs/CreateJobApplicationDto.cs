namespace Unique_X.DTOs
{
    public class CreateJobApplicationDto
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;

        // ============================================================
        // 🟢 الحقول دي كانت Required (مش Nullable) - وده كان بيسبب رفض أي طلب
        // من الفورمات الجديدة لأنها بتبعتهم فاضيين عمدًا (مش مستخدمين فيها)
        // خليناهم Nullable عشان يبقوا اختياريين فعليًا
        // ============================================================
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? HasJob { get; set; }
        public string? HasJobOther { get; set; }
        public string? WorkPlace { get; set; }
        public string? HasLaptop { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string? EnglishLevel { get; set; }
        public string? CrmTools { get; set; }
        public string? CrmToolsOther { get; set; }
        public string? PastExperiences { get; set; }
        public string? RealEstateBackground { get; set; }
        public string? CompanyType { get; set; }
        public string? ZoneWorkedOn { get; set; }
        public string? ProjectPreparation { get; set; }
        public string? VisitSite { get; set; }
        public string? DealsClosing { get; set; }
        public string? SalesLastQuarter { get; set; }
        public string? Notes { get; set; }
        public IFormFile? CvFile { get; set; }

        // ============================================================
        // 🟢 حقول جديدة - نظام الأسئلة الديناميكية لكل وظيفة
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