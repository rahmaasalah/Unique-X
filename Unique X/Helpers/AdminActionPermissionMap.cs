namespace Unique_X.Helpers
{
    // 🟢 خريطة ربط كل Action موجود في AdminController بالـ Permission Key الخاص بيه
    // (نفس الـ key المستخدم في PermissionCatalog.AdminPermissions وفي activeTab() بالفرونت)
    // أي Action مش موجود هنا بيتعامل معاه على إنه يحتاج صلاحية "settings" (احتياطًا - Fail Closed)
    public static class AdminActionPermissionMap
    {
        public static readonly Dictionary<string, string> Map = new(StringComparer.OrdinalIgnoreCase)
        {
            // Property Listings
            ["GetAllPropertiesDetailed"] = "props",
            ["TogglePropertyStatus"] = "props",
            ["ReassignProperty"] = "props",
            ["DuplicateProperty"] = "props",
            ["ToggleHotDeal"] = "hotDeals",

            // Pending Approval
            ["GetPendingProperties"] = "pending",
            ["ApproveProperty"] = "pending",
            ["ApproveDuplicate"] = "pending",
            ["RejectDuplicate"] = "pending",

            // Rejected
            ["RejectProperty"] = "rejected",

            // Sold
            ["GetSoldProperties"] = "sold",

            // Suspended properties / users
            ["GetSuspendedProperties"] = "suspProps",
            ["GetSuspendedUsers"] = "suspUsers",

            // Owners properties - لسه مفيش endpoints مخصصة ليها في AdminController (بتتعامل من كنترولر تاني)

            // Deletions
            ["GetPendingDeletions"] = "deletions",
            ["ApproveDeletion"] = "deletions",
            ["RejectDeletion"] = "deletions",

            // Banners
            ["AddBanner"] = "banners",
            ["DeleteBanner"] = "banners",
            ["GetBanners"] = "banners",
            ["ReorderBanners"] = "banners",

            // Home section banners
            ["GetHomeSectionBanners"] = "homeSectionBanners",
            ["UploadHomeSectionBanner"] = "homeSectionBanners",
            ["DeleteHomeSectionBanner"] = "homeSectionBanners",
            ["ReorderHomeSectionBanners"] = "homeSectionBanners",

            // Hot deals
            ["GetAllHotDeals"] = "hotDeals",
            ["AddHotDeal"] = "hotDeals",
            ["RemoveHotDeal"] = "hotDeals",

            // Recommended visits
            ["GetAllRecommendedVisits"] = "recommendedVisits",
            ["AddRecommendedVisit"] = "recommendedVisits",
            ["RemoveRecommendedVisit"] = "recommendedVisits",

            // Job postings
            ["GetActiveJobPostings"] = "jobPostings",
            ["GetAllJobPostings"] = "jobPostings",
            ["GetJobPostingById"] = "jobPostings",
            ["AddJobPosting"] = "jobPostings",
            ["UpdateJobPosting"] = "jobPostings",
            ["ToggleJobPosting"] = "jobPostings",
            ["DeleteJobPosting"] = "jobPostings",

            // Project meetings
            ["GetProjectMeetings"] = "projectMeetings",
            ["ToggleProjectMeetingContacted"] = "projectMeetings",
            ["DeleteProjectMeeting"] = "projectMeetings",

            // Lookups (developers/projects/regions)
            ["GetDevelopers"] = "lookups",
            ["AddDeveloper"] = "lookups",
            ["DeleteDeveloper"] = "lookups",
            ["GetProjects"] = "lookups",
            ["AddProject"] = "lookups",
            ["DeleteProject"] = "lookups",
            ["GetRegions"] = "lookups",
            ["AddRegion"] = "lookups",
            ["DeleteRegion"] = "lookups",
            ["GetApprovedPropertyCodes"] = "lookups",

            // Users management
            ["GetAllUsers"] = "users",
            ["ToggleUserStatus"] = "users",
            ["GrantCrmAccess"] = "users",
            ["RevokeCrmAccess"] = "users",

            // Broker limits & codes
            ["SetBrokerLimit"] = "brokerLimits",
            ["GetBrokerStats"] = "brokerLimits",
            ["SetBrokerCode"] = "brokerLimits",
            ["ClearBrokerCode"] = "brokerLimits",
            // GetBrokersWithCodes: [AllowAnonymous] فمش محتاج صلاحية

            // Financial files
            ["GetFinancialFile"] = "financial",
            ["UploadFinancialFile"] = "financial",
            ["DeleteFinancialFile"] = "financial",

            // Project financial files
            ["GetProjectFinancialFile"] = "projectFinancial",
            ["UploadProjectFinancialFile"] = "projectFinancial",
            ["DeleteProjectFinancialFile"] = "projectFinancial",

            // Analytics
            ["GetPropertiesAnalytics"] = "propertyAnalytics",
            ["TrackAction"] = "propertyAnalytics",
            ["GetSearchAnalytics"] = "searchAnalytics",
            ["LogSearch"] = "searchAnalytics",

            // Dashboard overview / settings
            ["GetDashboardStats"] = "settings",
            ["GetAutoReassignmentStatus"] = "settings",
        };

        // ⚠️ GetActivityLogs بيخدم تابين مختلفين (calls / whatsapp) على حسب الـ {type} route value
        // فبيتحدد وقت التنفيذ مش من الخريطة العادية - شوف AdminPermissionFilter
        public const string ActivityLogsAction = "GetActivityLogs";

        // 🟢 Actions قراءة بس، مفتوحة لأي مستخدم مسجل دخول (بروكر عنده CRM Access) من غير ما يحتاج
        // صلاحية "lookups" - المطلوب فعليًا للاستخدام العادي في فورمات زي Schedule Visit، مش للإدارة.
        // Add/Delete بتاعت نفس البيانات دي لسه تحت صلاحية "lookups" في الـ Map فوق.
        public static readonly HashSet<string> PublicReadActions = new(StringComparer.OrdinalIgnoreCase)
        {
            "GetRegions",
            "GetProjects",
            "GetDevelopers",
        };
    }
}