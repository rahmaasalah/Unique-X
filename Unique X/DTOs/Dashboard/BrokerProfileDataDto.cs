using Unique_X.DTOs.CRM;

namespace Unique_X.DTOs.Dashboard
{
    public class BrokerProfileDataDto
    {
        public List<LeadResponseDto> Leads { get; set; }
        public List<VisitResponseDto> Visits { get; set; }
        public List<BrokerTaskDto> Activities { get; set; }
    }
}
