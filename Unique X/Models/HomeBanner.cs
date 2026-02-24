namespace Unique_X.Models
{
        public class HomeBanner
        {
            public int Id { get; set; }
            public string ImageUrl { get; set; }
            public string PublicId { get; set; } // للحذف من Cloudinary
            public string MessageTitle { get; set; } // العنوان اللي هيظهر في رسالة الواتساب
        }
    }
