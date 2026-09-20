using System.ComponentModel.DataAnnotations;

namespace Unique_X.Models.Authorization
{
    // 🟢 صلاحية واحدة (تاب/قسم واحد) من ضمن الدور المخصص
    // القيمة PermissionKey بتطابق المفاتيح الموجودة في PermissionCatalog
    public class CustomRolePermission
    {
        public int Id { get; set; }

        public int CustomRoleId { get; set; }
        public CustomRole CustomRole { get; set; } = null!;

        [Required, MaxLength(60)]
        public string PermissionKey { get; set; } = string.Empty;
    }
}