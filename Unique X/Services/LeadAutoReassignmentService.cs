using Microsoft.EntityFrameworkCore;
using Unique_X.Data;

namespace Unique_X.Services
{
    // ============================================================
    // 🟢 خدمة السحب التلقائي للعملاء (Late / Too Late / Auto Unassign)
    // ============================================================
    // بتشتغل في الخلفية كل فترة (CheckIntervalMinutes) وبتعمل الآتي:
    // 1. أي Call/Visit لسه Pending وعدى عليه 72 ساعة من غير أكشن (أي نشاط واحد بس كفاية)
    //    -> يتم سحب العميل من البروكر الحالي (IsUnassigned = true)
    // 2. كل الأنشطة (Calls/Visits) المعلقة (Pending) بتاعت العميل ده بتتلغي (Status = Cancelled)
    //    عشان البروكر الجديد يبدأ من الصفر تمامًا لما الأدمن يديله العميل
    // ملحوظة: الـ Today/Late/Too Late نفسها (24 و 48 ساعة) بتتحسب لحظيًا في الـ DashboardController
    // وقت عرض الإشعارات - مفيش داعي نخزنها، الخدمة دي مسؤولة بس عن السحب النهائي بعد 72 ساعة.
    public class LeadAutoReassignmentService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<LeadAutoReassignmentService> _logger;

        // 🟢 الحد الأقصى قبل السحب: 72 ساعة من غير أي أكشن على النشاط
        private static readonly TimeSpan UnassignThreshold = TimeSpan.FromHours(72);

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

            var cutoff = DateTime.UtcNow - UnassignThreshold;

            // 🟢 خطوة 1: نلاقي كل الـ LeadIds اللي عندها نشاط واحد (Call) على الأقل عدى عليه 72 ساعة من غير رد
            var overdueLeadIdsFromActivities = await context.LeadActivities
                .Where(a => a.Status == "Pending" && a.DueDate <= cutoff)
                .Select(a => a.LeadId)
                .Distinct()
                .ToListAsync(stoppingToken);

            // 🟢 وكمان أي عميل عنده Visit عدى عليها 72 ساعة من غير رد
            var overdueLeadIdsFromVisits = await context.Visits
                .Where(v => v.Status == "Pending" && v.VisitDate <= cutoff)
                .Select(v => v.LeadId)
                .Distinct()
                .ToListAsync(stoppingToken);

            var overdueLeadIds = overdueLeadIdsFromActivities
                .Union(overdueLeadIdsFromVisits)
                .Distinct()
                .ToList();

            if (!overdueLeadIds.Any()) return;

            // 🟢 خطوة 2: نجيب بس العملاء اللي لسه معينين لبروكر (مسحوبينش قبل كده)
            var leadsToUnassign = await context.Leads
                .Where(l => overdueLeadIds.Contains(l.Id) && !l.IsUnassigned)
                .ToListAsync(stoppingToken);

            if (!leadsToUnassign.Any()) return;

            foreach (var lead in leadsToUnassign)
            {
                // 🟢 نلغي كل الأنشطة المعلقة بتاعت العميل ده - البروكر الجديد يبدأ من الصفر
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

                _logger.LogInformation("تم سحب العميل {LeadId} من البروكر {BrokerId} بسبب عدم الرد لمدة 72 ساعة", lead.Id, lead.BrokerId);
            }

            await context.SaveChangesAsync(stoppingToken);
        }
    }
}