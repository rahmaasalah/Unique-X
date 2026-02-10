namespace Unique_X.DTOs
{
    public class AuthModel
    {
        public string Message { get; set; }
        public bool IsAuthenticated { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public List<string> Roles { get; set; }
        public string Token { get; set; }
        public string? ProfileImageUrl { get; set; }

        public DateTime ExpiresOn { get; set; }
    }
}
