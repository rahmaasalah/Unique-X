using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.Helpers;

namespace Unique_X.Services
{
    // ============================================================
    // 🟢 خدمة السحب التلقائي للعملاء - بقت جزء من التراكر الموحّد الواحد
    // ============================================================
    // قبل كده كان فيه تراكرين منفصلين:
    //   1. تراكر الـ Late/TooLate (24/48 ساعة) - كان بيتحسب من أقدم Call/Visit لسه Pending
    //   2. تراكر السحب التلقائي (72 ساعة) - في الخدمة دي، وكان بيعتمد بردو على وجود Activity/Visit متأخرة
    //
    // دلوقتي بقوا تراكر واحد بس (LeadTrackerHelper) بيحسب من lead.UpdatedAt (أو CreatedAt لو لسه من غير أكشن).
    // الأكشن ده معناه أي حاجة البروكر يعملها للعميل: Feedback / Activity / Visit / Change Status / Edit Request..
    // كل الأكشنز دي أصلاً بتحدث lead.UpdatedAt، يعني التراكر بيتصفّر تلقائيًا في كل مرة.
    //
    // العتبات (زي LeadTrackerHelper بالظبط):
    //   >= 24 ساعة من غير أكشن -> Late  (بادج بس، من غير سحب)
    //   >= 48 ساعة من غير أكشن -> TooLate + في نفس اللحظة دي، الخدمة دي بتسحب العميل من البروكر ويروح عند الأدمن في Pending Clients
    // ============================================================
    public class LeadAutoReassignmentService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<LeadAutoReassignmentService> _logger;

        // بيفحص كل 15 دقيقة - عدد كافي وموفر للأداء بدل ما يفحص كل ثانية
        private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(15);

        public LeadAutoReassignmentService(IServiceProvider serviceProvider, ILogger<LeadAutoReassignmentService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessOverdueLeadsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "خطأ أثناء فحص العملاء المتأخرين (Auto Reassignment)");
                }

                await Task.Delay(CheckInterval, stoppingToken);
            }
        }

        private async Task ProcessOverdueLeadsAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var tooLateCutoff = DateTime.UtcNow.AddHours(-LeadTrackerHelper.TooLateThresholdHours);

            // 🟢 كل العملاء اللي لسه معينين لبروكر (مسحوبينش قبل كده)، وآخر أكشن حصل عليهم (UpdatedAt أو CreatedAt لو جديد)
            // عدى عليه 48 ساعة - مش شرط يكون عندهم Activity أو Visit مجدولة أصلاً، أي عميل ساكت لـ 48 ساعة بيتسحب
            var leadsToUnassign = await context.Leads
                .Where(l => !l.IsUnassigned && (l.UpdatedAt ?? l.CreatedAt) <= tooLateCutoff)
                .ToListAsync(stoppingToken);

            if (!leadsToUnassign.Any()) return;

            foreach (var lead in leadsToUnassign)
            {
                // 🟢 نلغي كل الأنشطة/الزيارات المعلقة بتاعت العميل ده - البروكر الجديد يبدأ من الصفر تمامًا
                var pendingActivities = await context.LeadActivities
                    .Where(a => a.LeadId == lead.Id && a.Status == "Pending")
                    .ToListAsync(stoppingToken);
                foreach (var act in pendingActivities)
                {
                    act.Status = "Cancelled";
                }

                var pendingVisits = await context.Visits
                    .Where(v => v.LeadId == lead.Id && v.Status == "Pending")
                    .ToListAsync(stoppingToken);
                foreach (var visit in pendingVisits)
                {
                    visit.Status = "Cancelled";
                }

                // 🟢 سحب العميل من البروكر الحالي
                lead.PreviousBrokerId = lead.BrokerId;
                lead.IsUnassigned = true;
                lead.UnassignedAt = DateTime.UtcNow;
                lead.UpdatedAt = DateTime.UtcNow;

                _logger.LogInformation("تم سحب العميل {LeadId} من البروكر {BrokerId} بسبب عدم اتخاذ أي أكشن لمدة 48 ساعة", lead.Id, lead.BrokerId);
            }

            await context.SaveChangesAsync(stoppingToken);
        }
    }
}