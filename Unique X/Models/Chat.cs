using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Unique_X.Models
{
    // محادثة: إما مباشرة بين اتنين (Direct) أو روم مفتوحة بلينك دعوة (Room)
    public class ChatConversation
    {
        public int Id { get; set; }

        // 0 = Direct, 1 = Room
        public int Type { get; set; }

        [MaxLength(100)]
        public string? Name { get; set; }              // اسم الروم (للـ Direct فاضي)

        [MaxLength(40)]
        public string? InviteCode { get; set; }        // كود لينك الدعوة (للروم بس)

        [MaxLength(100)]
        public string? DirectKey { get; set; }         // "idصغير_idكبير" عشان نمنع تكرار الـ Direct بين نفس الاتنين

        public string CreatedById { get; set; } = "";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

        public ICollection<ChatParticipant> Participants { get; set; } = new List<ChatParticipant>();
        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }

    public class ChatParticipant
    {
        public int ConversationId { get; set; }
        public ChatConversation? Conversation { get; set; }

        public string UserId { get; set; } = "";
        [ForeignKey(nameof(UserId))]
        public ApplicantUser? User { get; set; }

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastReadAt { get; set; } = DateTime.UtcNow;
    }

    public class ChatMessage
    {
        public long Id { get; set; }

        public int ConversationId { get; set; }
        public ChatConversation? Conversation { get; set; }

        public string SenderId { get; set; } = "";
        [ForeignKey(nameof(SenderId))]
        public ApplicantUser? Sender { get; set; }

        [MaxLength(4000)]
        public string? Text { get; set; }

        public string? ImageUrl { get; set; }

        // وحدة مرفقة بالرسالة (من الكود). من غير FK عشان لو الوحدة اتمسحت الرسالة تفضل موجودة
        public int? PropertyId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}