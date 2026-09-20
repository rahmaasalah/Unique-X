using System.ComponentModel.DataAnnotations;

namespace Unique_X.Models.Authorization
{
    // 🟢 ربط البروكر (اليوزر) بالدور المخصص - ممكن أكتر من بروكر ياخدوا نفس الدور
    // وممكن نفس البروكر ياخد أكتر من دور (واحد في الأدمن وواحد في الـ CRM مثلاً)
    public class CustomRoleMember
    {
        public int Id { get; set; }

        public int CustomRoleId { get; set; }
        public CustomRole CustomRole { get; set; } = null!;

        [Required]
        public string UserId { get; set; } = string.Empty;
        public ApplicantUser User { get; set; } = null!;

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    }
}