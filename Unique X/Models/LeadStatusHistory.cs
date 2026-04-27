namespace Unique_X.Models
{
    public class LeadStatusHistory
    {
        public int Id { get; set; }

        public int LeadId { get; set; }
        public Lead Lead { get; set; }

        public int OldStatusId { get; set; } // الحالة القديمة
        public int NewStatusId { get; set; } // الحالة الجديدة

        public string ChangedById { get; set; } // مين اللي غير الحالة (البروكر أو الأدمن)
        public ApplicantUser ChangedBy { get; set; }

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
        public string? Notes { get; set; } // لو البروكر عايز يكتب ملاحظة وهو بيغير الحالة
    }
}
