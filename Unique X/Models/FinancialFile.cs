namespace Unique_X.Models
{
    public class FinancialFile
    {
        public int Id { get; set; }
        public string FileName { get; set; }

        public byte[] FileData { get; set; }

        public string ContentType { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}