using System.ComponentModel.DataAnnotations;

namespace Unique_X.DTOs
{
    public class AddReviewDto
    {
        [Required, Range(1, 5)]
        public int Rating { get; set; }

        [Required, MaxLength(1000)]
        public string Comment { get; set; }
    }

    public class ReviewResponseDto
    {
        public int Id { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; }
        public DateTime CreatedAt { get; set; }

        public string UserName { get; set; }
        public string UserType { get; set; } // "Client" or "Broker"
        public string? UserImage { get; set; }

        // الريفيو ده بتاع اليوزر الحالي اللي فاتح الصفحة دلوقتي؟
        public bool IsOwn { get; set; }
        // اليوزر الحالي يقدر يمسح الريفيو ده (صاحبه أو أدمن)؟
        public bool CanDelete { get; set; }
    }
}