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
    }
}
