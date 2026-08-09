namespace Unique_X.DTOs
{
    public class DeveloperDto
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }

    public class ProjectDto
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public int Type { get; set; } // 0 = Primary, 1 = Resale
        public int City { get; set; } // PropEnums.City
        public string? Region { get; set; } // مطلوبة للـ Primary بس
        public int? DeveloperId { get; set; }
    }

    public class RegionDto
    {
        public string Name { get; set; } = string.Empty;
        public string? ZoneCode { get; set; }
        public int City { get; set; } // PropEnums.City
    }
}