namespace Unique_X.DTOs
{
    public class UserProfileDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public int UserType { get; set; }
        public int TotalProperties { get; set; } // لو بروكر: عدد عقاراته
        public int TotalWishlist { get; set; }   // لو كلاينت: عدد مفضلاته
    }
}
