namespace Unique_X.DTOs
{
    public class PermissionCatalogItemDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
    }

    public class CustomRoleMemberDto
    {
        public string UserId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? BrokerCode { get; set; }
        public string? PhoneNumber { get; set; }
    }

    public class CustomRoleDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Dashboard { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<string> Permissions { get; set; } = new();
        public List<CustomRoleMemberDto> Members { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class SaveCustomRoleDto
    {
        public string Name { get; set; } = string.Empty;
        public string Dashboard { get; set; } = string.Empty; // "Admin" | "Crm"
        public string? Description { get; set; }
        public List<string> PermissionKeys { get; set; } = new();
        public List<string> MemberUserIds { get; set; } = new();
    }

    public class MyPermissionsDto
    {
        public bool IsFullAdmin { get; set; }
        public bool HasCrmAccess { get; set; }

        // null = صلاحيات كل التابات (فُل أدمن) / أي list = التابات المسموحة بس
        public List<string>? AdminPermissions { get; set; }
        public List<string>? CrmPermissions { get; set; }

        public List<string> AdminRoleNames { get; set; } = new();
        public List<string> CrmRoleNames { get; set; } = new();
    }
}