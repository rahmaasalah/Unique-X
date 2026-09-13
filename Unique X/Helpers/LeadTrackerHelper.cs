namespace Unique_X.Helpers
{
    // ============================================================
    // 🟢 التراكر الموحّد بتاع العميل (Lead-level tracker)
    // ============================================================
    // ده مصدر الحقيقة الوحيد لحالة "التأخير" بتاعة العميل، وبيستخدمه:
    //   - LeadsController (GetLeads / GetLeadDetails)
    //   - DashboardController (GetBrokerProfileData)
    //   - AdminController (GetBrokerStats)
    //   - LeadAutoReassignmentService (السحب التلقائي)
    //
    // القاعدة: التراكر بيبدأ من CreatedAt، وبيتصفّر (يبدأ من جديد) في كل مرة
    // البروكر يعمل أي أكشن على العميل ده (Feedback / Activity / Visit / Change Status / Edit Request..)
    // - وده فعليًا بيحصل تلقائيًا لأن كل الأكشنز دي بالفعل بتحدث lead.UpdatedAt.
    //
    // العتبات:
    //   < 24 ساعة من غير أكشن  -> Active  (طبيعي)
    //   >= 24 ساعة              -> Late   (بادج بس، من غير سحب)
    //   >= 48 ساعة              -> TooLate (بادج تحذيري - العميل بدأ يقرب من السحب، بس لسه معاه)
    //   >= 72 ساعة              -> بيتسحب فعليًا من البروكر - شوفي LeadAutoReassignmentService
    // ============================================================
    public static class LeadTrackerHelper
    {
        public const double LateThresholdHours = 24;
        public const double TooLateThresholdHours = 48;

        // 🟢 العتبة الفعلية للسحب من البروكر - منفصلة عن TooLateThresholdHours
        // (TooLate = بادج تحذيري بس، الرقم ده هو اللي فعليًا بيحرك LeadAutoReassignmentService)
        public const double UnassignThresholdHours = 72;

        // بيرجع "Active" / "Late" / "TooLate"
        public static string GetLateStatus(DateTime? updatedAt, DateTime createdAt, DateTime? nowUtc = null)
        {
            var now = nowUtc ?? DateTime.UtcNow;
            var lastAction = updatedAt ?? createdAt;
            var hoursSinceAction = (now - lastAction).TotalHours;

            if (hoursSinceAction >= TooLateThresholdHours) return "TooLate";
            if (hoursSinceAction >= LateThresholdHours) return "Late";
            return "Active";
        }
    }
}