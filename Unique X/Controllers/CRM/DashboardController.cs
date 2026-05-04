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
                BrokerPerformances = brokers
            };

            return Ok(result);
        }

        // 2. إحصائيات لوحة البروكر
        // GET: api/crm/dashboard/broker/{brokerId}
        [HttpGet("broker/{brokerId}")]
        public async Task<IActionResult> GetBrokerDashboard(string brokerId)
        {
            var myLeads = await _context.Leads.Where(l => l.BrokerId == brokerId).CountAsync();
            var myClosedDeals = await _context.Leads.Where(l => l.BrokerId == brokerId && l.LeadStatusId == 5).CountAsync();
            var myRevenue = await _context.Leads.Where(l => l.BrokerId == brokerId).SumAsync(l => l.ExpectedRevenue ?? 0);

            // بنجيب المهام (المكالمات أو المواعيد) اللي المفروض البروكر يعملها النهاردة أو متأخرة عليه
            var today = DateTime.UtcNow.AddHours(3).Date;
            var pendingTasksList = await _context.LeadActivities
                .Include(a => a.Lead)
                // 👇 التعديل هنا: بنعتمد على Status == "Pending"
                .Where(a => a.AssignedToId == brokerId && a.Status == "Pending" && a.DueDate.Date <= today)
                .OrderBy(a => a.DueDate)
                .Select(a => new BrokerTaskDto
                {
                    Id = a.Id,
                    LeadId = a.LeadId,
                    LeadName = a.Lead.FullName,
                    ActivityType = a.ActivityType,
                    Summary = a.Summary,
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

            var pendingVisitsList = await _context.Visits
                .Include(v => v.Lead)
                // 👇 التعديل هنا: بنعتمد على Status == "Pending"
                .Where(v => v.BrokerId == brokerId && v.Status == "Pending" && v.VisitDate.Date <= today)
                .OrderBy(v => v.VisitDate)
                .Select(v => new VisitResponseDto
                {
                    Id = v.Id,
                    LeadId = v.LeadId,
                    LeadName = v.Lead.FullName,
                    LeadPhone = v.Lead.PhoneNumber,
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

            var result = new BrokerDashboardDto
            {
                TotalMyLeads = myLeads,
                MyClosedDeals = myClosedDeals,
                MyExpectedRevenue = myRevenue,
                MyPendingTasksToday = pendingTasksList.Count, // العدد
                PendingTasksList = pendingTasksList,
                PendingVisitsList = pendingVisitsList
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
                    CampaignName = l.Campaign != null ? l.Campaign.Name : "No Campaign",
                    CreatedAt = l.CreatedAt,
                    UpdatedAt = _context.LeadStatusHistories.Where(h => h.LeadId == l.Id).Max(h => (DateTime?)h.ChangedAt) ?? l.CreatedAt,

                    PropertyType = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).PropertyType ?? "",
                    Purpose = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).Purpose ?? "",
                    TotalAmount = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).TotalAmount ?? 0,
                    PreferredLocation = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).PreferredLocation ?? "Not Specified",
                    ZoneName = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).ZoneId == 1 ? "Cairo" :
                       _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).ZoneId == 2 ? "Alexandria" :
                       _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).ZoneId == 3 ? "North Coast" : "N/A",
                    PaymentMethod = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).PaymentMethod ?? "",
                    DownPayment = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).DownPayment,
                    InstallmentYears = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).InstallmentYears
                }).ToListAsync();

            var visits = await _context.Visits
                .Include(v => v.Lead)
                .Where(v => v.BrokerId == brokerId)
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
                    ListingType = v.ListingType,
                    Notes = v.Notes,
                    Region = v.Region,
                    Project = v.Project,
                    VisitDate = v.VisitDate,
                    Location = v.Location,
                    Feedback = v.Feedback,
                    Status = v.Status
                }).ToListAsync();

            var activities = await _context.LeadActivities
                .Include(a => a.Lead)
                .Where(a => a.AssignedToId == brokerId)
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
    }
}