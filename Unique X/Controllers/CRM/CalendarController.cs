using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;

namespace Unique_X.Controllers.CRM
{
    // 🟢 كاليندر الـ CRM: بيجمّع الزيارات (Visits) والمكالمات (LeadActivities) في قائمة واحدة
    // - بروكر: brokerId بتاعه بس  |  أدمن (Master Calendar): brokerId فاضي = كل البروكرز
    // أي زيارة/مكالمة بتتضاف من أي مكان (بروفايل أو lead-details) بتظهر هنا لأن المصدر هو نفس الجداول
    [Route("api/crm/[controller]")]
    [ApiController]
    public class CalendarController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CalendarController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/crm/calendar?from=2026-11-01&to=2026-11-30&brokerId=xxx
        [HttpGet]
        public async Task<IActionResult> GetEvents(
            [FromQuery] DateTime from,
            [FromQuery] DateTime to,
            [FromQuery] string? brokerId)
        {
            var start = from.Date;
            var endExclusive = to.Date.AddDays(1);
            bool allBrokers = string.IsNullOrWhiteSpace(brokerId);

            var visits = await _context.Visits
                .Where(v => v.VisitDate >= start && v.VisitDate < endExclusive)
                .Where(v => allBrokers || v.Lead.BrokerId == brokerId)
                .Select(v => new
                {
                    type = "visit",
                    id = v.Id,
                    leadId = v.LeadId,
                    leadName = v.Lead.FullName,
                    leadPhone = v.Lead.PhoneNumber,
                    brokerName = v.Lead.Broker != null ? (v.Lead.Broker.FirstName + " " + v.Lead.Broker.LastName) : "",
                    start = v.VisitDate,
                    status = v.Status,
                    title = v.VisitType != null ? v.VisitType + " visit" : "Visit",
                    location = v.Location,
                    propertyCode = v.PropertyCode,
                    notes = v.Notes
                })
                .ToListAsync();

            var calls = await _context.LeadActivities
                .Where(a => a.DueDate >= start && a.DueDate < endExclusive)
                .Where(a => allBrokers || a.Lead.BrokerId == brokerId)
                .Select(a => new
                {
                    type = "call",
                    id = a.Id,
                    leadId = a.LeadId,
                    leadName = a.Lead.FullName,
                    leadPhone = a.Lead.PhoneNumber,
                    brokerName = a.Lead.Broker != null ? (a.Lead.Broker.FirstName + " " + a.Lead.Broker.LastName) : "",
                    start = a.DueDate,
                    status = a.Status,
                    title = a.ActivityType,          // Call / WhatsApp
                    location = (string?)null,
                    propertyCode = a.PropertyCode,
                    notes = a.Summary
                })
                .ToListAsync();

            var all = visits.Cast<object>().Concat(calls.Cast<object>());
            return Ok(all);
        }
    }
}