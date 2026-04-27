namespace Unique_X.Models
{
    public class Visit
    {
        public int Id { get; set; }
        public int LeadId { get; set; }
        public Lead Lead { get; set; }

        public string BrokerId { get; set; } // البروكر اللي هيعمل الزيارة
        public int? PropertyId { get; set; } // العقار اللي رايحين نشوفه (من الموقع)

        public DateTime VisitDate { get; set; }
        public string Location { get; set; }
        public string Feedback { get; set; } // رأي العميل بعد الزيارة
        public bool IsCompleted { get; set; } // اتعملت ولا لسه
    }
}
