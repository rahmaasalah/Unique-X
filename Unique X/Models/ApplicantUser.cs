using Microsoft.AspNetCore.Identity;

namespace Unique_X.Models
{
    public class ApplicantUser: IdentityUser
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        // 0 = Client, 1 = Broker
        public int UserType { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string? ProfileImagePublicId { get; set; }
        public bool IsActive { get; set; } = true;
        public bool HasCrmAccess { get; set; } = false;
        public string? BrokerTitle { get; set; }
        public string? BrokerCode { get; set; } // مثال: X7, X10, X249
        public string? BrokerDescription { get; set; }
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

        // 🟢 الحد الأقصى لعدد الوحدات (النشطة/الغير مباعة) اللي البروكر يقدر يضيفها. null = من غير حد أقصى، الأدمن هو اللي بيحددها
        public int? PropertyLimit { get; set; }
        public int? LeadLimit { get; set; } = null;
    }
}
