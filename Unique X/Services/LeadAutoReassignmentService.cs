using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.Helpers;
using Unique_X.Models;

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

        // بيفحص كل دقيقتين
        private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(2);

        // 🟢 عشان نتأكد إن الخدمة شغالة فعلاً من غير ما نحتاج نوصل للـ server logs
        // شوفي AdminController -> GET admin/auto-reassignment-status
        public static DateTime? LastRunAtUtc { get; private set; }
        public static int LastRunUnassignedCount { get; private set; }
        public static string? LastRunError { get; private set; }

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
                    LastRunError = null;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "خطأ أثناء فحص العملاء المتأخرين (Auto Reassignment)");
                    LastRunError = ex.Message;
                }
                finally
                {
                    LastRunAtUtc = DateTime.UtcNow;
                }

                await Task.Delay(CheckInterval, stoppingToken);
            }
        }

        private async Task ProcessOverdueLeadsAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var unassignCutoff = DateTime.UtcNow.AddHours(-LeadTrackerHelper.UnassignThresholdHours);

            // 🟢 كل العملاء اللي لسه معينين لبروكر (مسحوبينش قبل كده)، وآخر أكشن حصل عليهم (UpdatedAt أو CreatedAt لو جديد)
            // عدى عليه 72 ساعة - مش شرط يكون عندهم Activity أو Visit مجدولة أصلاً، أي عميل ساكت لـ 72 ساعة بيتسحب
            // (الـ TooLate بادج بيظهر عند 48 ساعة كتحذير، بس السحب الفعلي بيحصل عند 72)
            var leadsToUnassign = await context.Leads
                .Where(l => !l.IsUnassigned && (l.UpdatedAt ?? l.CreatedAt) <= unassignCutoff)
                .ToListAsync(stoppingToken);

            if (!leadsToUnassign.Any())
            {
                LastRunUnassignedCount = 0;
                return;
            }

            foreach (var lead in leadsToUnassign)
            {
                // 🟢 البروكر القديم يفقد كل سجل المكالمات والزيارات بتاعته مع العميل ده تمامًا
                // (مش بس اللي Pending - كل حاجة، من لحظة السحب نفسها، عشان ميقدرش يوصل لبيانات
                // العميل تاني حتى لو العميل لسه في Pending Clients ومتحطش لبروكر جديد بعد)
                await LeadReassignmentCleanupHelper.PurgeBrokerHistoryForLeadAsync(context, lead.Id, lead.BrokerId);

                // 🟢 سحب العميل من البروكر الحالي
                lead.PreviousBrokerId = lead.BrokerId;
                lead.IsUnassigned = true;
                lead.UnassignedAt = DateTime.UtcNow;
                lead.UpdatedAt = DateTime.UtcNow;

                // 🟢 إشعار للبروكر إن العميل ده اتشال من عنده بسبب عدم التحديث
                context.BrokerNotifications.Add(new BrokerNotification
                {
                    BrokerId = lead.BrokerId,
                    LeadId = lead.Id,
                    Type = "LeadRemoved",
                    Message = $"Client \"{lead.FullName}\" was removed from your list due to no update for 72 hours.",
                    CreatedAt = DateTime.UtcNow
                });

                _logger.LogInformation("تم سحب العميل {LeadId} من البروكر {BrokerId} بسبب عدم اتخاذ أي أكشن لمدة 72 ساعة", lead.Id, lead.BrokerId);
            }

            await context.SaveChangesAsync(stoppingToken);
            LastRunUnassignedCount = leadsToUnassign.Count;
        }
    }
}