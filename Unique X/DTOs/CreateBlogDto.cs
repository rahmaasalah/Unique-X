namespace Unique_X.DTOs
{
    public class CreateBlogDto
    {
        public string Title { get; set; } = string.Empty;
        public string Excerpt { get; set; } = string.Empty;

        // كانت اسمها Category
        public string? Zone { get; set; }
        public string? ProjectName { get; set; }
        public string? DeveloperName { get; set; }

        public bool IsPublished { get; set; } = true;

        public decimal? PricePerMeterResale { get; set; }
        public decimal? PricePerMeterPrimary { get; set; }

        public string? Button1Label { get; set; }
        public string? Button2Label { get; set; }
        public string? Button3Label { get; set; }

        public string? ProjectDetails { get; set; }
        public string? MapEmbedUrl { get; set; }

        public string? PaymentPlansJson { get; set; }

        // كانت اسمها UnitIdsJson
        public string? ResaleUnitIdsJson { get; set; }
        public string? PrimaryUnitIdsJson { get; set; }

        public string? ArticleSectionsJson { get; set; }
        public string? FaqsJson { get; set; }
        public string? AdminPhone { get; set; }

        public List<IFormFile>? SliderImages { get; set; }
        public IFormFile? Button1Image { get; set; }
        public IFormFile? Button2Image { get; set; }
        public IFormFile? Button3Image { get; set; }
        public IFormFile? MasterPlanImage { get; set; }

        // ── Main/Cover image selection ──
        // لو الأدمن اختار صورة "main" من صورة موجودة بالفعل على Cloudinary
        public string? CoverImageUrl { get; set; }
        // لو الأدمن اختار صورة "main" من الصور الجديدة اللي بيرفعها دلوقتي (index جوه SliderImages)
        public int? MainNewImageIndex { get; set; }
    }
}