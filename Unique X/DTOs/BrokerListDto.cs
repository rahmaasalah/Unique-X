namespace Unique_X.DTOs
{
    public class BrokerListDto
    {
        public string Id { get; set; }
        public string FullName { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string? BrokerTitle { get; set; }
        public string? BrokerDescription { get; set; }
        public int PropertiesCount { get; set; }
    }
}
