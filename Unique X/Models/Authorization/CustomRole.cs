using System.ComponentModel.DataAnnotations;

namespace Unique_X.Models.Authorization
{
    // 🟢 "دور مخصص" بيعمله الأدمن (مثلاً: Team Leader) وبيديله صلاحيات محدودة
    // من صلاحيات الأدمن الكاملة، إما في الـ Admin Dashboard أو الـ CRM Dashboard
    public class CustomRole
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        // "Admin" أو "Crm" - بيحدد الدور ده بيدي صلاحيات في أنهي لوحة
        [Required, MaxLength(20)]
        public string Dashboard { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string CreatedByUserId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<CustomRolePermission> Permissions { get; set; } = new List<CustomRolePermission>();
        public ICollection<CustomRoleMember> Members { get; set; } = new List<CustomRoleMember>();
    }
}