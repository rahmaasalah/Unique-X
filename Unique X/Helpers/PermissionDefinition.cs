namespace Unique_X.Helpers
{
    public class PermissionDefinition
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
    }

    // 🟢 القائمة الثابتة لكل الصلاحيات (تابات) الموجودة في admin-dashboard و crm-dashboard.
    // الـ Key هنا لازم يفضل مطابق تمامًا لقيمة activeTab() المستخدمة في الفرونت إند
    // (ده اللي بيربط checkbox الصلاحية بالتاب اللي بتتحكم فيه فعليًا في الواجهة والباك إند)
    public static class PermissionCatalog
    {
        public const string DashboardAdmin = "Admin";
        public const string DashboardCrm = "Crm";

        public static readonly List<PermissionDefinition> AdminPermissions = new()
        {
            new() { Key = "props", Label = "Property Listings" },
            new() { Key = "pending", Label = "Pending Approval" },
            new() { Key = "rejected", Label = "Rejected Properties" },
            new() { Key = "sold", Label = "Sold Properties" },
            new() { Key = "suspProps", Label = "Suspended Properties" },
            new() { Key = "ownerProps", Label = "Owners Properties" },
            new() { Key = "deletions", Label = "Pending Deletions" },
            new() { Key = "banners", Label = "Home Banners" },
            new() { Key = "homeSectionBanners", Label = "Home Section Banners" },
            new() { Key = "hotDeals", Label = "Hot Deals" },
            new() { Key = "recommendedVisits", Label = "Recommended to Visit" },
            new() { Key = "articles", Label = "Blogs" },
            new() { Key = "blogs", Label = "Projects (Primary/Resale)" },
            new() { Key = "launches", Label = "Launches" },
            new() { Key = "launchMeetings", Label = "Launch Meetings" },
            new() { Key = "projectMeetings", Label = "Project Meetings" },
            new() { Key = "lookups", Label = "Developers / Projects / Regions" },
            new() { Key = "jobPostings", Label = "Job Postings" },
            new() { Key = "ourTeam", Label = "Our Team" },
            new() { Key = "users", Label = "Users Management" },
            new() { Key = "suspUsers", Label = "Suspended Users" },
            new() { Key = "brokerLimits", Label = "Broker Limits & Codes" },
            new() { Key = "financial", Label = "Financial Files" },
            new() { Key = "projectFinancial", Label = "Project Financial Files" },
            new() { Key = "propertyAnalytics", Label = "Property Analytics" },
            new() { Key = "searchAnalytics", Label = "Search Analytics" },
            new() { Key = "calls", Label = "Call Click Logs" },
            new() { Key = "whatsapp", Label = "WhatsApp Click Logs" },
            new() { Key = "settings", Label = "Dashboard Overview / Settings" },
        };

        public static readonly List<PermissionDefinition> CrmPermissions = new()
        {
            new() { Key = "new_leads", Label = "New Leads" },
            new() { Key = "requested_leads", Label = "Requested Leads" },
            new() { Key = "requests", Label = "Requests" },
            new() { Key = "pending_clients", Label = "Pending Clients" },
            new() { Key = "clients", Label = "Clients" },
            new() { Key = "closing_stage", Label = "Closing Stage" },
            new() { Key = "closed_deals", Label = "Closed Deals" },
            new() { Key = "transfer_leads", Label = "Transfer Leads" },
            new() { Key = "pending_duplicates", Label = "Pending Duplicates" },
            new() { Key = "rejected_duplicates", Label = "Rejected Duplicates" },
            new() { Key = "all_visits", Label = "All Visits" },
            new() { Key = "all_activities", Label = "All Activities" },
            new() { Key = "calendar", Label = "Calendar" },
            new() { Key = "favorites", Label = "Favorites" },
            new() { Key = "admin_favorites", Label = "Admin Favorites" },
            new() { Key = "brokers", Label = "Brokers" },
            new() { Key = "add_broker", Label = "Add Broker" },
            new() { Key = "broker_codes", Label = "Broker Codes" },
            new() { Key = "broker_limits", Label = "Broker Limits" },
            new() { Key = "revenue", Label = "Revenue" },
            new() { Key = "report", Label = "Reports" },
        };

        public static bool IsValidKey(string dashboard, string key)
        {
            var list = dashboard == DashboardCrm ? CrmPermissions : AdminPermissions;
            return list.Any(p => p.Key == key);
        }
    }
}