namespace Unique_X.Models
{
    public class Launch
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Excerpt { get; set; } = string.Empty; // وصف قصير للكارت
        public string Content { get; set; } = string.Empty; // المحتوى الكامل (HTML أو Markdown)
        public string? CoverImageUrl { get; set; }          // صورة الغلاف
        public string? Zone { get; set; }                    // Alexandria / Cairo / North Coast
        public string? ProjectName { get; set; }             // اختياري - من ليست المشروعات حسب الـ Zone
        public string? DeveloperName { get; set; }           // اختياري - من ليست المطورين
        public bool IsPublished { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // 🟢 تاريخ التسليم اللي الأدمن بيحدده لمشروع اللونش (لسه بيتبني، هيتسلم إمتى) — بيتعرض كـ "Delivery in {year}"
        public DateTime? DeliveryDate { get; set; }

        // ترتيب الظهور اللي الأدمن بيحدده بالـ drag & drop (الأصغر يظهر الأول)
        public int DisplayOrder { get; set; } = 0;

        // Photo Slider — مفصولة بـ |
        public string? SliderImages { get; set; }

        // سعر المتر
        public decimal? PricePerMeterResale { get; set; }
        public decimal? PricePerMeterPrimary { get; set; }

        // 3 Buttons
        public string? Button1Label { get; set; }
        public string? Button1ImageUrl { get; set; }
        public string? Button2Label { get; set; }
        public string? Button2ImageUrl { get; set; }
        public string? Button3Label { get; set; }
        public string? Button3ImageUrl { get; set; }

        // تفاصيل المشروع
        public string? ProjectDetails { get; set; }

        // Map
        public string? MapEmbedUrl { get; set; }

        // Master Plan
        public string? MasterPlanImageUrl { get; set; }

        // Payment Plans — JSON array
        public string? PaymentPlansJson { get; set; }

        // Units — JSON array of property IDs
        public string? ResaleUnitIdsJson { get; set; }
        public string? PrimaryUnitIdsJson { get; set; }
        public string? RentUnitIdsJson { get; set; }

        public decimal? DownPaymentPercentage { get; set; }
        public decimal? AvgDownPayment { get; set; }

        // Article Sections — JSON array [{headline, text}]
        public string? ArticleSectionsJson { get; set; }

        // FAQs — JSON array [{question, answer}]
        public string? FaqsJson { get; set; }
        public string? AdminPhone { get; set; }
    }
}