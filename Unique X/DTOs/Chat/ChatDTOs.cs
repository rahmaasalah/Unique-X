using System.ComponentModel.DataAnnotations;

namespace Unique_X.DTOs.Chat
{
    public class StartDirectDto { [Required] public string UserId { get; set; } = ""; }

    public class CreateRoomDto { [Required, MaxLength(100)] public string Name { get; set; } = ""; }

    public class JoinRoomDto { [Required] public string InviteCode { get; set; } = ""; }

    // multipart/form-data
    public class SendMessageForm
    {
        [MaxLength(4000)] public string? Text { get; set; }
        [MaxLength(60)] public string? PropertyCode { get; set; }
        public IFormFile? Image { get; set; }
    }

    public class ChatPropertyDto
    {
        public int Id { get; set; }
        public string? Code { get; set; }
        public string? Title { get; set; }
        public decimal Price { get; set; }
        public string? City { get; set; }
        public string? Region { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class ChatMessageDto
    {
        public long Id { get; set; }
        public int ConversationId { get; set; }
        public string SenderId { get; set; } = "";
        public string SenderName { get; set; } = "";
        public string? SenderImage { get; set; }
        public string? Text { get; set; }
        public string? ImageUrl { get; set; }
        public ChatPropertyDto? Property { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ChatMemberDto
    {
        public string UserId { get; set; } = "";
        public string Name { get; set; } = "";
        public string? ImageUrl { get; set; }
    }

    public class ConversationDto
    {
        public int Id { get; set; }
        public int Type { get; set; }
        public string Title { get; set; } = "";
        public string? ImageUrl { get; set; }
        public string? InviteCode { get; set; }
        public int MembersCount { get; set; }
        public int UnreadCount { get; set; }
        public string? LastMessage { get; set; }
        public DateTime LastMessageAt { get; set; }
        public List<ChatMemberDto>? Members { get; set; }
    }

    public class ChatUserDto
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public string? ImageUrl { get; set; }
        public int UserType { get; set; }
    }
}