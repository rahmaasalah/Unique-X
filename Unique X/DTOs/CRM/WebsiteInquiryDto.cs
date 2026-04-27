namespace Unique_X.DTOs.CRM
{
    public class WebsiteInquiryDto
    {
        public string ClientName { get; set; }
        public string ClientPhone { get; set; }
        public string? ClientEmail { get; set; }
        public int PropertyId { get; set; } // الـ ID بتاع العقار اللي العميل داس عليه
        public string? Message { get; set; } // الرسالة اللي العميل كتبها
    }
}
