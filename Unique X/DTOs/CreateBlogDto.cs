namespace Unique_X.DTOs
{
    public class CreateBlogDto
    {
        public string Title { get; set; } = string.Empty;
        public string Excerpt { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Category { get; set; }
        public bool IsPublished { get; set; } = true;
        public IFormFile? CoverImage { get; set; }

        public List<IFormFile>? SliderImages { get; set; }

        // Price per meter
        public decimal? PricePerMeterResale { get; set; }
        public decimal? PricePerMeterPrimary { get; set; }

        // 3 Buttons
        public string? Button1Label { get; set; }
        public IFormFile? Button1Image { get; set; }
        public string? Button2Label { get; set; }
        public IFormFile? Button2Image { get; set; }
        public string? Button3Label { get; set; }
        public IFormFile? Button3Image { get; set; }

        // Project Details
        public string? ProjectDetails { get; set; }

        // Map
        public string? MapEmbedUrl { get; set; }

        // Master Plan image
        public IFormFile? MasterPlanImage { get; set; }

        // JSON strings
        public string? PaymentPlansJson { get; set; }
        public string? UnitIdsJson { get; set; }
        public string? ArticleSectionsJson { get; set; }
        public string? FaqsJson { get; set; }

        public string? AdminPhone { get; set; }

    }
}
