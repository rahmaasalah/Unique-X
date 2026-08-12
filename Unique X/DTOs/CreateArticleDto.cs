namespace Unique_X.DTOs
{
    public class CreateArticleDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Excerpt { get; set; }

        // صورة جديدة يترفعها الأدمن، أو لو مفيش هيبعت CoverImageUrl القديم عند التعديل
        public IFormFile? CoverImage { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? CoverCaption { get; set; }

        public string WrittenBy { get; set; } = string.Empty;
        public DateTime? PublishedAt { get; set; }
        public bool IsPublished { get; set; } = true;

        // ===== 5 بانرات إعلانية (صورة/GIF/فيديو) + لينك تحويل لكل واحد =====
        public IFormFile? Ad1Media { get; set; }
        public string? Ad1Link { get; set; }

        public IFormFile? Ad2Media { get; set; }
        public string? Ad2Link { get; set; }

        public IFormFile? Ad3Media { get; set; }
        public string? Ad3Link { get; set; }

        public IFormFile? Ad4Media { get; set; }
        public string? Ad4Link { get; set; }

        public IFormFile? Ad5Media { get; set; }
        public string? Ad5Link { get; set; }

        public string? SectionsJson { get; set; }
        public string? KeywordsJson { get; set; }
    }
}