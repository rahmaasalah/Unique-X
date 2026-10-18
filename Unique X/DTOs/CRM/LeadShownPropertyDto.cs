using System.ComponentModel.DataAnnotations;

namespace Unique_X.DTOs.CRM
{
    public class AddShownFeedbackDto
    {
        [Required, Range(1, 5)]
        public int Rating { get; set; }

        [Required, MaxLength(1000)]
        public string Comment { get; set; } = string.Empty;

        // البروكر (أو الأدمن) اللي بيسجل رأي العميل
        public string? BrokerId { get; set; }
    }
}