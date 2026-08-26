using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs.CRM;
using Unique_X.DTOs.Dashboard;

namespace Unique_X.Controllers.CRM
{
    [Route("api/crm/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        // 1. إحصائيات لوحة الأدمن (المدير)
        // GET: api/crm/dashboard/admin
        [HttpGet("admin")]
        public async Task<IActionResult> GetAdminDashboard()
        {
            var totalLeads = await _context.Leads.CountAsync();

            // هنفترض إن الـ Status الخاص بـ "Deal Closed" الـ ID بتاعه مثلاً 5 
            // (هتغيري رقم 5 ده بعدين برقم الحالة الحقيقي عندك في الداتابيز)
            var closedDeals = await _context.Leads.Where(l => l.LeadStatusId == 5).CountAsync();
            var totalRevenue = await _context.Leads.SumAsync(l => l.ExpectedRevenue ?? 0);
            var totalRequests = await _context.Leads.Where(l => l.LeadStatusId == 4).CountAsync(); // 4 = Calls (request)
            var totalClosing = await _context.Leads.Where(l => l.LeadStatusId == 18).CountAsync(); // 18 = Follow up for closing
            var totalVisits = await _context.Visits.CountAsync();
            var totalActivities = await _context.LeadActivities.CountAsync();

            // حساب أداء كل بروكر
            var brokers = await _context.Leads
                .Include(l => l.Broker)
                .GroupBy(l => new { l.BrokerId, l.Broker.UserName })
                .Select(g => new BrokerPerformanceDto
                {
                    BrokerName = g.Key.UserName,
                    TotalLeads = g.Count(),
                    ClosedDeals = g.Count(l => l.LeadStatusId == 5)
                })
                .ToListAsync();

            var result = new AdminDashboardDto
            {
                TotalLeads = totalLeads,
                TotalClosedDeals = closedDeals,
                TotalExpectedRevenue = totalRevenue,
                TotalRequests = totalRequests, // 👈
                TotalVisits = totalVisits,     // 👈
                TotalActivities = totalActivities, // 👈
                TotalClosingLeads = totalClosing,
                BrokerPerformances = brokers
            };

            return Ok(result);
        }

        // 2. إحصائيات لوحة البروكر
        // GET: api/crm/dashboard/broker/{brokerId}
        [HttpGet("broker/{brokerId}")]
        public async Task<IActionResult> GetBrokerDashboard(string brokerId)
        {
            var myLeads = await _context.Leads.Where(l => l.BrokerId == brokerId && !l.IsUnassigned).CountAsync();
            var myClosedDeals = await _context.Leads.Where(l => l.BrokerId == brokerId && l.LeadStatusId == 5).CountAsync();
            var myRevenue = await _context.Leads.Where(l => l.BrokerId == brokerId).SumAsync(l => l.ExpectedRevenue ?? 0);

            // 🟢 نجيب كل الأنشطة/الزيارات المعلقة (Pending) بتاعت البروكر - وبعدين نصنفهم Today/Late/Too Late في الميموري
            var now = DateTime.UtcNow;
            var todayLocal = now.AddHours(3).Date; // توقيت مصر

            var pendingTasksRaw = await _context.LeadActivities
                .Include(a => a.Lead)
                .Where(a => a.AssignedToId == brokerId && a.Status == "Pending" && !a.Lead.IsUnassigned)
                .OrderBy(a => a.DueDate)
                .Select(a => new BrokerTaskDto
                {
                    Id = a.Id,
                    LeadId = a.LeadId,
                    LeadName = a.Lead.FullName,
                    ActivityType = a.ActivityType,
                    Summary = a.Summary,
                    IsDone = a.IsDone,
                    DueDate = a.DueDate,
                    PropertyCode = a.PropertyCode,
                    PropertyName = a.PropertyName,
                    BrokerPhone = a.BrokerPhone,
                    ZoneId = a.ZoneId,
                    ListingType = a.ListingType ?? "",
                    Region = a.Region,
                    Project = a.Project,
                    Notes = a.Notes
                }).ToListAsync();

            var pendingVisitsRaw = await _context.Visits
                .Include(v => v.Lead)
                .Where(v => v.BrokerId == brokerId && v.Status == "Pending" && !v.Lead.IsUnassigned)
                .OrderBy(v => v.VisitDate)
                .Select(v => new VisitResponseDto
                {
                    Id = v.Id,
                    LeadId = v.LeadId,
                    LeadName = v.Lead.FullName,
                    LeadPhone = v.Lead.PhoneNumber,
                    VisitType = v.VisitType,
                    PropertyCode = v.PropertyCode,
                    PropertyName = v.PropertyName,
                    BrokerPhone = v.BrokerPhone,
                    ZoneId = v.ZoneId,
                    ListingType = v.ListingType,
                    Notes = v.Notes,
                    Region = v.Region,
                    Project = v.Project,
                    VisitDate = v.VisitDate,
                    Location = v.Location,
                    Feedback = v.Feedback,
                    Status = v.Status
                }).ToListAsync();

            // 🟢 دالة التصنيف: Today / Late (عدى عليه 24 ساعة) / Too Late (عدى عليه 48 ساعة)
            string Categorize(DateTime dueDate)
            {
                var hoursOverdue = (now - dueDate).TotalHours;
                if (hoursOverdue >= 48) return "TooLate";
                if (hoursOverdue >= 24) return "Late";
                return "Today"; // شامل أي حاجة لسه معلقة ووقتها جه أو النهاردة
            }

            foreach (var t in pendingTasksRaw) t.LateStatus = Categorize(t.DueDate);
            foreach (var v in pendingVisitsRaw) v.LateStatus = Categorize(v.VisitDate);

            // 🟢 بنعرض بس اللي وصل وقته فعلًا (النهاردة أو فات معاده) - نفس فلسفة الجرس القديمة
            var todayTasks = pendingTasksRaw.Where(t => t.DueDate.Date <= todayLocal && t.LateStatus == "Today").ToList();
            var lateTasks = pendingTasksRaw.Where(t => t.LateStatus == "Late").ToList();
            var tooLateTasks = pendingTasksRaw.Where(t => t.LateStatus == "TooLate").ToList();

            var todayVisits = pendingVisitsRaw.Where(v => v.VisitDate.Date <= todayLocal && v.LateStatus == "Today").ToList();
            var lateVisits = pendingVisitsRaw.Where(v => v.LateStatus == "Late").ToList();
            var tooLateVisits = pendingVisitsRaw.Where(v => v.LateStatus == "TooLate").ToList();

            var result = new BrokerDashboardDto
            {
                TotalMyLeads = myLeads,
                MyClosedDeals = myClosedDeals,
                MyExpectedRevenue = myRevenue,
                MyPendingTasksToday = todayTasks.Count + todayVisits.Count,

                // 🟢 للتوافق مع الكود القديم (لو مستخدم في مكان تاني)
                PendingTasksList = pendingTasksRaw,
                PendingVisitsList = pendingVisitsRaw,

                // 🟢 التصنيف الجديد بالـ 3 categories
                TodayCount = todayTasks.Count + todayVisits.Count,
                LateCount = lateTasks.Count + lateVisits.Count,
                TooLateCount = tooLateTasks.Count + tooLateVisits.Count,
                TodayTasks = todayTasks,
                LateTasks = lateTasks,
                TooLateTasks = tooLateTasks,
                TodayVisits = todayVisits,
                LateVisits = lateVisits,
                TooLateVisits = tooLateVisits
            };

            return Ok(result);
        }


        // 3. جلب كل بيانات بروفايل البروكر (عملاء - زيارات - مهام)
        [HttpGet("broker-profile/{brokerId}")]
        public async Task<IActionResult> GetBrokerProfileData(string brokerId)
        {
            var leads = await _context.Leads
                .Include(l => l.Status)
                .Include(l => l.Broker)
                .Include(l => l.Campaign)
                .Where(l => l.BrokerId == brokerId)
                .OrderByDescending(l => l.CreatedAt)
                .Select(l => new LeadResponseDto
                {
                    Id = l.Id,
                    FullName = l.FullName,
                    PhoneNumber = l.PhoneNumber,
                    BrokerName = l.Broker.UserName,
                    StatusId = l.LeadStatusId,
                    GeneralFeedback = l.GeneralFeedback ?? "",
                    StatusName = l.Status.Name,
                    CampaignName = !string.IsNullOrEmpty(l.CampaignName) ? l.CampaignName :
                   (l.Campaign != null ? l.Campaign.Name : "No Campaign"),

                    // تأكدي من إضافة CampaignSource و ReferredBy
                    CampaignSource = l.CampaignSource ?? "Direct",
                    ReferredBy = l.ReferredBy ?? "",
                    CreatedAt = l.CreatedAt,
                    UpdatedAt = l.UpdatedAt ?? l.CreatedAt,
                    IsDuplicate = l.IsDuplicate,
                    IsApprovedDuplicate = l.IsApprovedDuplicate,

                    PropertyType = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).PropertyType ?? "",
                    Purpose = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).Purpose ?? "",
                    TotalAmount = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).TotalAmount ?? 0,
                    PreferredLocation = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).PreferredLocation ?? "Not Specified",
                    ZoneName = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).ZoneId == 1 ? "Cairo" :
                       _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).ZoneId == 2 ? "Alexandria" :
                       _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).ZoneId == 3 ? "North Coast" : "N/A",
                    PaymentMethod = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).PaymentMethod ?? "",
                    DownPayment = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).DownPayment,
                    InstallmentYears = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).InstallmentYears,

                    VisitsCount = _context.Visits.Count(v => v.LeadId == l.Id),
                    CompletedVisits = _context.Visits.Count(v => v.LeadId == l.Id && v.Status == "Completed"),
                    PendingVisits = _context.Visits.Count(v => v.LeadId == l.Id && v.Status == "Pending"),
                    CancelledVisits = _context.Visits.Count(v => v.LeadId == l.Id && v.Status == "Cancelled"),
                    RescheduledVisits = _context.Visits.Count(v => v.LeadId == l.Id && v.Status == "Rescheduled"),

                    ActivitiesCount = _context.LeadActivities.Count(a => a.LeadId == l.Id),
                    CompletedActivities = _context.LeadActivities.Count(a => a.LeadId == l.Id && a.Status == "Completed"),
                    PendingActivities = _context.LeadActivities.Count(a => a.LeadId == l.Id && a.Status == "Pending"),
                    CancelledActivities = _context.LeadActivities.Count(a => a.LeadId == l.Id && a.Status == "Cancelled"),
                    RescheduledActivities = _context.LeadActivities.Count(a => a.LeadId == l.Id && a.Status == "Rescheduled")
                }).ToListAsync();

            var brokerLeadIds = await _context.Leads
    .Where(l => l.BrokerId == brokerId)
    .Select(l => l.Id)
    .ToListAsync();

            //var visits = await _context.Visits
            //    .Include(v => v.Lead)
            //    .Where(v => v.BrokerId == brokerId)
            //    .OrderByDescending(v => v.VisitDate)
            //    .Select(v => new VisitResponseDto

            var visits = await _context.Visits
    .Include(v => v.Lead)
    .Where(v => brokerLeadIds.Contains(v.LeadId))
    .OrderByDescending(v => v.VisitDate)
    .Select(v => new VisitResponseDto
    {
        Id = v.Id,
        LeadName = v.Lead.FullName,
        LeadPhone = v.Lead.PhoneNumber,
        PropertyCode = v.PropertyCode,
        PropertyName = v.PropertyName,
        BrokerPhone = v.BrokerPhone,
        ZoneId = v.ZoneId,
        VisitType = v.VisitType,
        ListingType = v.ListingType,
        Notes = v.Notes,
        Region = v.Region,
        Project = v.Project,
        VisitDate = v.VisitDate,
        Location = v.Location,
        Feedback = v.Feedback,
        Status = v.Status
    }).ToListAsync();

            //var activities = await _context.LeadActivities
            //    .Include(a => a.Lead)
            //    .Where(a => a.AssignedToId == brokerId)
            //    .OrderByDescending(a => a.DueDate)
            //    .Select(a => new BrokerTaskDto

            var activities = await _context.LeadActivities
    .Include(a => a.Lead)
    .Where(a => brokerLeadIds.Contains(a.LeadId))
    .OrderByDescending(a => a.DueDate)
    .Select(a => new BrokerTaskDto
    {
        Id = a.Id,
        LeadId = a.LeadId,
        LeadName = a.Lead.FullName,
        ActivityType = a.ActivityType,
        Summary = a.Summary,
        DueDate = a.DueDate,
        Status = a.Status,
        IsDone = a.IsDone,

        // 👇 ضفنا قراءة الحقول دي من الداتابيز عشان تتبعت للجدول
        PropertyCode = a.PropertyCode,
        PropertyName = a.PropertyName,
        BrokerPhone = a.BrokerPhone,
        ZoneId = a.ZoneId,
        ListingType = a.ListingType ?? "",
        Region = a.Region,
        Project = a.Project,
        Notes = a.Notes
    }).ToListAsync();

            return Ok(new BrokerProfileDataDto { Leads = leads, Visits = visits, Activities = activities });
        }

        [HttpGet("admin-calendar")]
        public async Task<IActionResult> GetAdminCalendarEvents()
        {
            var visits = await _context.Visits
                .Include(v => v.Lead)
                .Include(v => v.Lead.Broker)
                .Select(v => new
                {
                    Id = v.Id,
                    Type = "Visit",
                    Title = v.Location,
                    Date = v.VisitDate,
                    Status = v.Status,
                    Feedback = v.Feedback ?? "",
                    BrokerName = v.Lead.Broker.FirstName + " " + v.Lead.Broker.LastName,
                    ClientName = v.Lead.FullName
                }).ToListAsync();

            var activities = await _context.LeadActivities
                .Include(a => a.Lead)
                .Include(a => a.AssignedTo)
                .Select(a => new
                {
                    Id = a.Id,
                    Type = a.ActivityType,
                    Title = a.Summary,
                    Date = a.DueDate,
                    Status = a.Status,
                    Feedback = a.Notes ?? "",
                    BrokerName = a.AssignedTo.FirstName + " " + a.AssignedTo.LastName,
                    ClientName = a.Lead.FullName
                }).ToListAsync();

            var allEvents = visits.Concat(activities).OrderBy(e => e.Date).ToList();
            return Ok(allEvents);
        }

        // 4. تقرير أداء البروكر اليومي (للأدمن)
        // GET: api/crm/dashboard/broker-report/{brokerId}?from=2026-06-01&to=2026-06-30
        [HttpGet("broker-report/{brokerId}")]
        public async Task<IActionResult> GetBrokerReport(string brokerId, [FromQuery] string? from, [FromQuery] string? to)
        {
            // تحديد نطاق التاريخ
            var fromDate = string.IsNullOrEmpty(from)
                ? DateTime.UtcNow.AddDays(-30)
                : DateTime.Parse(from).ToUniversalTime();
            var toDate = string.IsNullOrEmpty(to)
                ? DateTime.UtcNow.AddDays(1)
                : DateTime.Parse(to).ToUniversalTime().AddDays(1); // نضيف يوم عشان يشمل اليوم كامل

            var brokerLeadIds = await _context.Leads
                .Where(l => l.BrokerId == brokerId)
                .Select(l => l.Id)
                .ToListAsync();

            // Activities (Calls/WhatsApp) في الفترة دي
            var activities = await _context.LeadActivities
                .Include(a => a.Lead)
                .Where(a => brokerLeadIds.Contains(a.LeadId)
                         && a.DueDate >= fromDate
                         && a.DueDate < toDate)
                .OrderByDescending(a => a.DueDate)
                .Select(a => new
                {
                    a.Id,
                    LeadName = a.Lead.FullName,
                    LeadPhone = a.Lead.PhoneNumber,
                    a.ActivityType,
                    a.Summary,
                    a.Status,
                    a.DueDate,
                    UpdatedAt = a.DueDate, // بنستخدم DueDate كـ reference للتحديث
                    Feedback = a.Notes ?? "",
                    a.IsDone
                })
                .ToListAsync();

            // Visits في الفترة دي
            var visits = await _context.Visits
                .Include(v => v.Lead)
                .Where(v => brokerLeadIds.Contains(v.LeadId)
                         && v.VisitDate >= fromDate
                         && v.VisitDate < toDate)
                .OrderByDescending(v => v.VisitDate)
                .Select(v => new
                {
                    v.Id,
                    LeadName = v.Lead.FullName,
                    LeadPhone = v.Lead.PhoneNumber,
                    v.VisitDate,
                    v.Location,
                    v.Status,
                    v.Feedback,
                    v.Notes,
                    PropertyCode = v.PropertyCode ?? ""
                })
                .ToListAsync();

            // Leads بحالات معينة
            var newLeads = await _context.Leads
                .Where(l => l.BrokerId == brokerId && l.LeadStatusId == 1
                         && l.CreatedAt >= fromDate && l.CreatedAt < toDate)
                .OrderByDescending(l => l.CreatedAt)
                .Select(l => new { l.Id, l.FullName, l.PhoneNumber, l.CreatedAt })
                .ToListAsync();

            var requestLeads = await _context.Leads
                .Where(l => l.BrokerId == brokerId
                         && l.LeadStatusId == 4
                         && (l.UpdatedAt ?? l.CreatedAt) >= fromDate
                         && (l.UpdatedAt ?? l.CreatedAt) < toDate)
                .OrderByDescending(l => l.UpdatedAt ?? l.CreatedAt)
                .Select(l => new { l.Id, l.FullName, l.PhoneNumber, l.CreatedAt })
                .ToListAsync();

            var followUpVisitLeads = await _context.Leads
                .Where(l => l.BrokerId == brokerId && l.LeadStatusId == 6)
                .Select(l => new { l.Id, l.FullName, l.PhoneNumber, l.CreatedAt })
                .ToListAsync();

            // ملخص يومي للـ Activities
            var dailySummary = activities
                .GroupBy(a => a.DueDate.Date)
                .Select(g => new
                {
                    Date = g.Key.ToString("yyyy-MM-dd"),
                    TotalCalls = g.Count(a => a.ActivityType == "Call"),
                    TotalWhatsApp = g.Count(a => a.ActivityType == "WhatsApp"),
                    TotalActivities = g.Count(),
                    CompletedActivities = g.Count(a => a.Status == "Completed")
                })
                .OrderByDescending(d => d.Date)
                .ToList();

            // ملخص يومي للـ Visits
            var dailyVisitSummary = visits
                .GroupBy(v => v.VisitDate.Date)
                .Select(g => new
                {
                    Date = g.Key.ToString("yyyy-MM-dd"),
                    TotalVisits = g.Count(),
                    CompletedVisits = g.Count(v => v.Status == "Completed"),
                    PendingVisits = g.Count(v => v.Status == "Pending")
                })
                .OrderByDescending(d => d.Date)
                .ToList();

            var requestLeadIds = await _context.Leads
                .Where(l => l.BrokerId == brokerId
                         && l.LeadStatusId == 4
                         && (l.UpdatedAt ?? l.CreatedAt) >= fromDate
                         && (l.UpdatedAt ?? l.CreatedAt) < toDate)
                .Select(l => l.Id)
                .ToListAsync();

            var requestDetails = await _context.LeadRequests
                .Include(r => r.Lead)
                .Where(r => requestLeadIds.Contains(r.LeadId))
                .OrderByDescending(r => r.Id)
                .Select(r => new
                {
                    r.Id,
                    LeadName = r.Lead.FullName,
                    LeadPhone = r.Lead.PhoneNumber,
                    r.PropertyType,
                    r.Purpose,
                    r.TotalAmount,
                    r.PaymentMethod,
                    r.DownPayment,
                    r.InstallmentYears,
                    r.PreferredLocation,
                    r.Notes,
                    ZoneName = r.ZoneId == 1 ? "Cairo" : r.ZoneId == 2 ? "Alexandria" : r.ZoneId == 3 ? "North Coast" : "N/A"
                })
                .ToListAsync();

            return Ok(new
            {
                BrokerId = brokerId,
                FromDate = fromDate.ToString("yyyy-MM-dd"),
                ToDate = toDate.AddDays(-1).ToString("yyyy-MM-dd"),
                DailySummary = dailySummary,
                DailyVisitSummary = dailyVisitSummary,
                Activities = activities,
                Visits = visits,
                NewLeads = new { Count = newLeads.Count, Leads = newLeads },
                RequestLeads = new { Count = requestLeads.Count, Leads = requestLeads },
                FollowUpVisitLeads = new { Count = followUpVisitLeads.Count, Leads = followUpVisitLeads },
                RequestDetails = requestDetails
            });
        }
    }
}