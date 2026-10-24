namespace Unique_X.Models
{
    // الإعدادات بتتقرا من appsettings.json -> "Valuation"
    public class ValuationOptions
    {
        // أسعار الإعلانات = أسعار طلب، غالباً أعلى من سعر البيع الفعلي.
        // 1.0 = من غير خصم. ابدأي بـ 0.95 وعدليها لما تقارني بأسعار بيع حقيقية.
        public double AskingToMarketFactor { get; set; } = 0.95;

        // أقل عدد وحدات في نفس المنطقة عشان نكتفي بيها (لو أقل نوسّع على المدينة)
        public int MinCompsSameRegion { get; set; } = 5;

        // أقصى عدد وحدات مشابهة بنحسب منها
        public int TopComps { get; set; } = 15;

        // أقل درجة تشابه مقبولة (من 0 لـ 1)
        public double MinScore { get; set; } = 0.25;
    }
}