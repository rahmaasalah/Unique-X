using System.ComponentModel.DataAnnotations;

namespace Unique_X.DTOs.Chat
{
    // multipart/form-data
    public class LiveSendForm
    {
        [MaxLength(30)] public string? GuestName { get; set; }
        [MaxLength(40)] public string? GuestKey { get; set; }
        [MaxLength(1000)] public string? Text { get; set; }
        [MaxLength(60)] public string? PropertyCode { get; set; }
        public IFormFile? Image { get; set; }
    }

    public class LiveMessageDto
    {
        public long Id { get; set; }
        public string SenderKey { get; set; } = "";   // userId أو GuestKey (لتحديد "رسالتي")
        public string SenderName { get; set; } = "";
        public string? SenderImage { get; set; }
        public bool IsGuest { get; set; }
        public string? Text { get; set; }
        public string? ImageUrl { get; set; }
        public ChatPropertyDto? Property { get; set; }
        public bool IsPinned { get; set; }
        public DateTime? PinnedAt { get; set; }
        public string? PinnedByName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}