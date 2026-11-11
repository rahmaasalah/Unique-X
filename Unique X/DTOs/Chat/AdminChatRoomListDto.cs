namespace Unique_X.DTOs.Chat
{
    // سطر في جدول Rooms في الأدمن داشبورد
    public class AdminChatRoomListDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string CreatedById { get; set; } = "";
        public string CreatedByName { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public int CurrentMembers { get; set; }       // الأعضاء الموجودين دلوقتي
        public int TotalMembersEver { get; set; }     // كل اللي دخلوا الروم (حتى اللي خرجوا)
        public int MessagesCount { get; set; }
        public DateTime LastActivityAt { get; set; }  // آخر رسالة (أو وقت الإنشاء)
        public DateTime? EndedAt { get; set; }        // لو مفيش أعضاء دلوقتي: وقت خروج آخر عضو. null = الروم شغالة
    }

    public class AdminChatStintDto
    {
        public DateTime JoinedAt { get; set; }
        public DateTime? LeftAt { get; set; }
    }

    public class AdminChatMemberDto
    {
        public string UserId { get; set; } = "";
        public string Name { get; set; } = "";
        public string? Email { get; set; }
        public string UserType { get; set; } = "";    // Broker / Client / Unknown
        public bool IsCurrent { get; set; }
        public bool IsCreator { get; set; }
        public List<AdminChatStintDto> Stints { get; set; } = new();   // كل مرة دخل وخرج فيها
    }

    public class AdminChatRoomDetailDto : AdminChatRoomListDto
    {
        public List<AdminChatMemberDto> Members { get; set; } = new();
    }
}