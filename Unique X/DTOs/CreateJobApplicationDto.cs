namespace Unique_X.DTOs
{
    public class CreateJobApplicationDto
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? City { get; set; }
        public string HasJob { get; set; } = string.Empty;
        public string? WorkPlace { get; set; }
        public string HasLaptop { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string EnglishLevel { get; set; } = string.Empty;
        public string CrmTools { get; set; } = string.Empty;
        public string? PastExperiences { get; set; }
        public string? RealEstateBackground { get; set; }
        public string CompanyType { get; set; } = string.Empty;
        public string ZoneWorkedOn { get; set; } = string.Empty;
        public string ProjectPreparation { get; set; } = string.Empty;
        public string VisitSite { get; set; } = string.Empty;
        public string DealsClosing { get; set; } = string.Empty;
        public string SalesLastQuarter { get; set; } = string.Empty;
        public IFormFile? CvFile { get; set; }
    }
}
