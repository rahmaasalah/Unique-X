namespace Unique_X.Models
{
    public class JobApplication
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? City { get; set; }
        public string HasJob { get; set; } = string.Empty; // Yes / No / Other
        public string? HasJobOther { get; set; }
        public string? WorkPlace { get; set; }
        public string HasLaptop { get; set; } = string.Empty; // Yes / No
        public string JobTitle { get; set; } = string.Empty;
        public string EnglishLevel { get; set; } = string.Empty;
        public string CrmTools { get; set; } = string.Empty; // مفصولة بفاصلة
        public string? CrmToolsOther { get; set; }
        public string? PastExperiences { get; set; }
        public string? RealEstateBackground { get; set; }
        public string CompanyType { get; set; } = string.Empty;
        public string ZoneWorkedOn { get; set; } = string.Empty;
        public string ProjectPreparation { get; set; } = string.Empty;
        public string VisitSite { get; set; } = string.Empty;
        public string DealsClosing { get; set; } = string.Empty;
        public string SalesLastQuarter { get; set; } = string.Empty;
        public string? CvUrl { get; set; } // لينك الـ CV على Google Drive
        public string Status { get; set; } = "Pending"; // Pending / Confirmed / Scheduled

        public string? RejectionReason { get; set; }
        public string? CallFeedback { get; set; }     // ملاحظات الكول - متاح في أي مرحلة
        public string? AttendanceStatus { get; set; } // Attended / NotAttended
        public string? FinalDecision { get; set; }    // Accepted / Rejected
        public string? FinalRejectionReason { get; set; }
        public string? FinalFeedback { get; set; }    // ملاحظات نهائية بعد الـ Accept
        public string? Notes { get; set; }
        public string? InterviewDate { get; set; }

        // === Interview Feedback ===
        public string? InterviewFeedbackExperienceInRE { get; set; }  // Yes / No
        public string? InterviewFeedbackPastExperiences { get; set; }
        public string? InterviewFeedbackWhyRealEstate { get; set; }
        public string? InterviewFeedbackKnowledge { get; set; }
        public string? InterviewFeedbackSalesProcess { get; set; }    // Yes / No
        public string? InterviewFeedbackGoal { get; set; }            // e.g. "50K-100K"
        public string? InterviewFeedbackAppearance { get; set; }      // Bad / Good / Excellent
        public string? InterviewFeedbackCommunication { get; set; }   // Bad / Good / Excellent
        public string? InterviewFeedbackPresentation { get; set; }    // Bad / Good / Excellent
        public string? InterviewFeedbackLanguage { get; set; }        // Entry-level / Mid-level / Advanced
        public string? InterviewFeedbackNotes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
