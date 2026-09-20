using Microsoft.EntityFrameworkCore;
using Unique_X.Data;

namespace Unique_X.Helpers
{
    // 🟢 لما عميل (Lead) يتسحب/يتنقل من بروكر (سواء تلقائي بعد 72 ساعة، أو يدوي من الأدمن عن طريق
    // Transfer / Bulk Transfer / Assign New Broker)، البروكر القديم لازم يفقد الوصول الكامل لبيانات
    // العميل ده - يعني سجل المكالمات (LeadActivities) وسجل الزيارات (Visits) بتاعته مع العميل ده
    // لازم يتمسحوا تمامًا (مش بس Pending)، عشان البروكر القديم ميقدرش يشوف رقم تليفون العميل أو
    // أي تفاصيل تانية من تاب Calls/Visits بتاعته بعد كده.
    public static class LeadReassignmentCleanupHelper
    {
        /// <summary>
        /// بتمسح كل LeadActivities و Visits الخاصة بالعميل ده والمرتبطة بالبروكر القديم تحديدًا.
        /// محتاجة SaveChangesAsync بعدها من نفس الـ context (بنعمل بس RemoveRange هنا، مش بنعمل Save
        /// عشان تتضم مع باقي التغييرات في نفس العملية اللي بتستدعيها).
        /// </summary>
        public static async Task PurgeBrokerHistoryForLeadAsync(AppDbContext context, int leadId, string? oldBrokerId)
        {
            if (string.IsNullOrEmpty(oldBrokerId)) return;

            var activitiesToDelete = await context.LeadActivities
                .Where(a => a.LeadId == leadId && a.AssignedToId == oldBrokerId)
                .ToListAsync();
            context.LeadActivities.RemoveRange(activitiesToDelete);

            var visitsToDelete = await context.Visits
                .Where(v => v.LeadId == leadId && v.BrokerId == oldBrokerId)
                .ToListAsync();
            context.Visits.RemoveRange(visitsToDelete);
        }
    }
}