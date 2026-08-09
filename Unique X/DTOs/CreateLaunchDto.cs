namespace Unique_X.DTOs
{
    // 🟢 نفس شكل CreateBlogDto بالظبط، بس لـ Launches — للـ Create والـ Update (multipart/form-data)
    public class CreateLaunchDto
    {
        public string Title { get; set; } = string.Empty;
        public string Excerpt { get; set; } = string.Empty;
        public string? Zone { get; set; }
        public string? ProjectName { get; set; }
        public string? DeveloperName { get; set; }
        public bool IsPublished { get; set; } = true;

        // 🟢 تاريخ التسليم اللي الأدمن بيختاره
        public DateTime? DeliveryDate { get; set; }

        public decimal? PricePerMeterResale { get; set; }
        public decimal? PricePerMeterPrimary { get; set; }
        public decimal? DownPaymentPercentage { get; set; }
        public decimal? AvgDownPayment { get; set; }

        public string? Button1Label { get; set; }
        public string? Button2Label { get; set; }
        public string? Button3Label { get; set; }

        public string? ProjectDetails { get; set; }
        public string? MapEmbedUrl { get; set; }

        public string? PaymentPlansJson { get; set; }
        public string? ResaleUnitIdsJson { get; set; }
        public string? PrimaryUnitIdsJson { get; set; }
        public string? RentUnitIdsJson { get; set; }
        public string? ArticleSectionsJson { get; set; }
        public string? FaqsJson { get; set; }
        public string? AdminPhone { get; set; }

        // Slider images الجديدة اللي هترفع دلوقتي
        public List<IFormFile>? SliderImages { get; set; }

        // لو الأدمن اختار صورة main من الصور الجديدة اللي بيرفعها دلوقتي (index جوه SliderImages)
        public int? MainNewImageIndex { get; set; }

        // لو الأدمن اختار صورة main من صورة Cloudinary موجودة بالفعل
        public string? CoverImageUrl { get; set; }

        public IFormFile? Button1Image { get; set; }
        public IFormFile? Button2Image { get; set; }
        public IFormFile? Button3Image { get; set; }
        public IFormFile? MasterPlanImage { get; set; }
    }
}