namespace Unique_X.DTOs
{
    public class UserProfileDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public int UserType { get; set; }
        public string? ProfileImageUrl { get; set; }
        public int TotalProperties { get; set; } // لو بروكر: عدد عقاراته
        public int TotalWishlist { get; set; }   // لو كلاينت: عدد مفضلاته
        public List<UserPropertyInfo>? Properties { get; set; }
    }

    public class UserPropertyInfo
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string PropertyType { get; set; }
    }
}
