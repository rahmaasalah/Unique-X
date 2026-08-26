using System.ComponentModel.DataAnnotations.Schema;

namespace Unique_X.Models
{
    public class Visit
    {
        public int Id { get; set; }
        public int LeadId { get; set; }
        public Lead Lead { get; set; }

        public string BrokerId { get; set; } // البروكر اللي هيعمل الزيارة
        public string? PropertyCode { get; set; }
        public string? PropertyName { get; set; }
        public string? BrokerPhone { get; set; }
        public string? ContactPhone { get; set; } // رقم تواصل خاص بالزيارة دي بس (ممكن يختلف عن رقم حساب العميل)

        public int ZoneId { get; set; }
        public string ListingType { get; set; }
        public string? VisitType { get; set; }
        public string? Notes { get; set; }
        public string? Region { get; set; }
        public string? Project { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Completed, Cancelled, Rescheduled

        public DateTime VisitDate { get; set; }
        public string Location { get; set; }
        public string Feedback { get; set; } // رأي العميل بعد الزيارة
        public bool IsCompleted { get; set; } // اتعملت ولا لسه
        public bool IsAdminAction { get; set; } = false;
        public bool IsClientInitiated { get; set; } = false;

        // 🟢 محسوبة لحظيًا - مش متخزنة في الداتابيز
        [NotMapped]
        public string LateStatus
        {
            get
            {
                if (Status != "Pending") return "None";
                var hoursOverdue = (DateTime.UtcNow - VisitDate).TotalHours;
                if (hoursOverdue >= 48) return "TooLate";
                if (hoursOverdue >= 24) return "Late";
                return "OnTime";
            }
        }
    }
}