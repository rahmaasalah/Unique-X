namespace Unique_X.DTOs.CRM
{
    public class LeadResponseDto
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string BrokerName { get; set; } // هنرجع اسم البروكر مش الـ ID
        public string StatusName { get; set; } // هنرجع اسم الحالة 
        public string CampaignName { get; set; }
        public string ZoneName { get; set; }
        public int StatusId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal? QuarterlyInstallment { get; set; }

        public string PropertyType { get; set; }
        public string PreferredLocation { get; set; }
        public string GeneralFeedback { get; set; }
        public string Purpose { get; set; }
        public string CampaignSource { get; set; } // مصدر الحملة
        public string ReferredBy { get; set; } // كود البروكر
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; } // 👈 ده اللي هيحل مشكلة التاريخ

        public string PaymentMethod { get; set; }
        public decimal? DownPayment { get; set; }
        public int? InstallmentYears { get; set; }

        public int VisitsCount { get; set; }
        public int ActivitiesCount { get; set; }
        public string? LastActionBy { get; set; }

        public bool IsDuplicate { get; set; }
        public bool IsApprovedDuplicate { get; set; }
        public bool IsRejectedDuplicate { get; set; }
        public string? OriginalBrokerName { get; set; }
        public string? DuplicateRequestedByBrokerName { get; set; }
        public int ClosedDealsCount { get; set; }

        public int CompletedVisits { get; set; }
        public int PendingVisits { get; set; }
        public int CancelledVisits { get; set; }
        public int RescheduledVisits { get; set; }

        public int CompletedActivities { get; set; }
        public int PendingActivities { get; set; }
        public int CancelledActivities { get; set; }
        public int RescheduledActivities { get; set; }

        public string SelectedRegions { get; set; }
        public string SelectedProjects { get; set; }
        public string Notes { get; set; }

        // ============================================================
        // 🟢 نظام السحب التلقائي (Auto Reassignment)
        // ============================================================
        public string? BrokerId { get; set; }
        public string? PreviousBrokerId { get; set; }
        public bool IsUnassigned { get; set; }

        // 🟢 لو true، الفرونت لازم يعرض السطر ده كـ "Disappeared" بس - من غير أي بيانات تانية
        // (بيتحسب بس لما بنجيب الليستة لبروكر معين وكان هو البروكر القديم بتاع عميل اتسحب منه)
        public bool IsDisappeared { get; set; }

        // 🟢 Today / Late / TooLate - محسوبة من أقدم Call/Visit لسه Pending على العميل ده
        public string? LateStatus { get; set; }

        // 🟢 هل العميل ده اتنقل للبروكر الحالي بواسطة الأدمن (Transfer) في أي وقت؟
        public bool IsTransferredIn { get; set; }

        // ============================================================
        // 🟢 حقول "Get Recommendation" الجديدة - PropertyType و Purpose بقوا Multi-select (Comma-separated)
        // ============================================================
        public string? SelectedCities { get; set; }
        public int? MinRooms { get; set; }
        public int? MaxRooms { get; set; }
        public int? MinBathrooms { get; set; }
        public int? MaxBathrooms { get; set; }
        public decimal? MinBudget { get; set; }
        public decimal? MaxBudget { get; set; }

        // 🟢 true لو الليد ده جاي من مودال Get Recommendation ولسه ما اتوزعش على بروكر حقيقي
        public bool IsNewFromWebsite { get; set; }
    }
}