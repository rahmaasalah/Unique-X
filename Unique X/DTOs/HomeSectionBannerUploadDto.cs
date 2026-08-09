namespace Unique_X.DTOs
{
    public class HomeSectionBannerUploadDto
    {
        public string Key { get; set; } = string.Empty;
        public IFormFile File { get; set; } = null!;
    }
}
