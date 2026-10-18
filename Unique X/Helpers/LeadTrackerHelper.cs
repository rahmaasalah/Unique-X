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

        // 🟢 الحالات اللي التراكر بيتجمّد فيها (مفيش Late / Too Late / سحب تلقائي وهو في أي واحدة منهم):
        //   7  = Visit scheduled
        //   8  = Follow up After visit
        //   18 = Follow up for closing
        //   28 = Owner
        public const int OwnerStatusId = 28;
        private static readonly HashSet<int> FrozenStatusIds = new() { 7, 8, 18, OwnerStatusId };

        public static bool IsFrozenStatus(int statusId) => FrozenStatusIds.Contains(statusId);

        // الوقت اللي عدى على آخر أكشن. لو التراكر متجمّد بنحسب لحد لحظة التجميد بس (مش لحد دلوقتي).
        // لو حصل أكشن جديد وهو متجمّد (UpdatedAt بعد وقت التجميد) بيتحسب صفر.
        public static double ElapsedHours(DateTime? updatedAt, DateTime createdAt, DateTime now, DateTime? frozenAt = null)
        {
            var lastAction = updatedAt ?? createdAt;
            var end = frozenAt ?? now;
            return Math.Max(0, (end - lastAction).TotalHours);
        }

        // بيرجع "Active" / "Late" / "TooLate"
        public static string GetLateStatus(DateTime? updatedAt, DateTime createdAt, DateTime? nowUtc = null, DateTime? frozenAt = null)
        {
            var now = nowUtc ?? DateTime.UtcNow;
            var hoursSinceAction = ElapsedHours(updatedAt, createdAt, now, frozenAt);

            if (hoursSinceAction >= TooLateThresholdHours) return "TooLate";
            if (hoursSinceAction >= LateThresholdHours) return "Late";
            return "Active";
        }
    }
}