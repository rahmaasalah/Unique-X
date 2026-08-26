using System.ComponentModel.DataAnnotations.Schema;

namespace Unique_X.Models
{
    public class LeadActivity
    {
        public int Id { get; set; }
        public int LeadId { get; set; }
        public Lead Lead { get; set; }

        public string ActivityType { get; set; } // Call, Meeting, Email, To-Do
        public string Summary { get; set; } // e.g., Discuss Proposal
        public DateTime DueDate { get; set; }

        public string AssignedToId { get; set; } // BrokerId
        public ApplicantUser AssignedTo { get; set; }

        public string? PropertyCode { get; set; }
        public string? PropertyName { get; set; }
        public string? BrokerPhone { get; set; }
        public int ZoneId { get; set; }
        public string ListingType { get; set; }
        public string? Region { get; set; }
        public string? Project { get; set; }

        public string? Notes { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Completed, Cancelled, Rescheduled
        public bool IsDone { get; set; } = false; // اتعملت ولا لسه
        public bool IsAdminAction { get; set; } = false;

        // 🟢 محسوبة لحظيًا - مش متخزنة في الداتابيز - بتتحدث كل ما حد يجيبها
        // Pending + عدى عليها 48 ساعة = TooLate | Pending + عدى عليها 24 ساعة = Late | غير كده = OnTime
        [NotMapped]
        public string LateStatus
        {
            get
            {
                if (Status != "Pending") return "None";
                var hoursOverdue = (DateTime.UtcNow - DueDate).TotalHours;
                if (hoursOverdue >= 48) return "TooLate";
                if (hoursOverdue >= 24) return "Late";
                return "OnTime";
            }
        }
    }
}