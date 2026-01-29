using Microsoft.AspNetCore.Identity;

namespace Unique_X.Models
{
    public class ApplicantUser: IdentityUser
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        // 0 = Client, 1 = Broker
        public int UserType { get; set; }
    }
}
