using System.ComponentModel.DataAnnotations;

namespace Unique_X.DTOs
{
    public class ForgotPasswordDto
    {
        [Required, EmailAddress]
        public string Email { get; set; }
    }

    public class ResetPasswordDto
    {
        [Required]
        public string Email { get; set; }
        [Required]
        public string Token { get; set; }
        [Required, MinLength(6)]
        public string NewPassword { get; set; }
    }
}