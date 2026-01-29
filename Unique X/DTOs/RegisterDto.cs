using System.ComponentModel.DataAnnotations;

namespace Unique_X.DTOs
{
    public class RegisterDto
    {
        [Required, MaxLength(100)]
        public string FirstName { get; set; }

        [Required, MaxLength(100)]
        public string LastName { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }

        [Required]
        public string PhoneNumber { get; set; }

        // 0 = Client, 1 = Broker
        [Required]
        public int UserType { get; set; }
    }
}
