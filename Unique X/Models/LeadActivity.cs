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

        public string? Notes { get; set; }
        public bool IsDone { get; set; } = false; // اتعملت ولا لسه
    }
}
