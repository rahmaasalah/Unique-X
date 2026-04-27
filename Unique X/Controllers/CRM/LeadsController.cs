using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs.CRM;
using Unique_X.Models;

namespace Unique_X.Controllers.CRM
{
    [Route("api/crm/[controller]")]
    [ApiController]
    public class LeadsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeadsController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Endpoint: عشان الأدمن يضيف Lead جديد
        // POST: api/crm/leads
        [HttpPost]
        public async Task<IActionResult> CreateLead([FromBody] CreateLeadDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // 1. إنشاء وحفظ الـ Lead الأساسي
            var newLead = new Lead
            {
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                Email = dto.Email,
                BrokerId = dto.BrokerId,
                CampaignId = dto.CampaignId,
                LeadStatusId = dto.LeadStatusId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Leads.Add(newLead);
            await _context.SaveChangesAsync(); // بنحفظ هنا عشان يتولد لينا newLead.Id

            // 2. إنشاء وحفظ الـ Lead Request المربوط بيه
            var newLeadRequest = new LeadRequest
            {
                LeadId = newLead.Id,
                PropertyType = dto.PropertyType,
                Purpose = dto.Purpose,
                TotalAmount = dto.TotalAmount,
                PaymentMethod = dto.PaymentMethod ?? "", // بياخد اللي البروكر كتبه
                PreferredLocation = dto.PreferredLocation ?? "",
                Notes = dto.Notes ?? ""
            };

            _context.LeadRequests.Add(newLeadRequest);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Lead and Request created successfully!", leadId = newLead.Id });
        }

        // 2. Endpoint: عشان البروكر يجيب الـ Leads بتاعته (بالفلاتر)
        // GET: api/crm/leads?brokerId=123&statusId=5
        [HttpGet]
        public async Task<IActionResult> GetLeads([FromQuery] string brokerId, [FromQuery] int? statusId)
        {
            var query = _context.Leads
                .Include(l => l.Status)
                .Include(l => l.Broker)
                .Include(l => l.Campaign)
                .AsQueryable();

            // فلتر بالبروكر
            if (!string.IsNullOrEmpty(brokerId))
            {
                query = query.Where(l => l.BrokerId == brokerId);
            }

            // فلتر بالحالة
            if (statusId.HasValue)
            {
                query = query.Where(l => l.LeadStatusId == statusId.Value);
            }

            var leads = await query.Select(l => new LeadResponseDto
            {
                Id = l.Id,
                FullName = l.FullName,
                PhoneNumber = l.PhoneNumber,
                BrokerName = l.Broker.UserName,
                StatusId = l.LeadStatusId,
                StatusName = l.Status.Name,
                PropertyType = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).PropertyType ?? "",
                Purpose = _context.LeadRequests.FirstOrDefault(r => r.LeadId == l.Id).Purpose ?? "",
                CampaignName = l.Campaign != null ? l.Campaign.Name : "No Campaign",
                CreatedAt = l.CreatedAt
            }).ToListAsync();

            return Ok(leads);
        }

        // 3. Endpoint: لتحديث حالة الـ Lead وتسجيلها في الـ History
        // PUT: api/crm/leads/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateLeadStatus(int id, [FromBody] UpdateLeadStatusDto dto)
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null) return NotFound(new { message = "Lead not found" });

            // تسجيل الـ History
            var history = new LeadStatusHistory
            {
                LeadId = lead.Id,
                OldStatusId = lead.LeadStatusId,
                NewStatusId = dto.NewStatusId,
                ChangedById = dto.BrokerId,
                Notes = dto.Notes,
                ChangedAt = DateTime.UtcNow
            };

            _context.LeadStatusHistories.Add(history);

            // تحديث الحالة الأساسية للعميل
            lead.LeadStatusId = dto.NewStatusId;
            _context.Leads.Update(lead);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Lead status updated successfully!" });
        }

        [HttpPost("website-inquiry")]
        public async Task<IActionResult> ReceiveWebsiteInquiry([FromBody] WebsiteInquiryDto dto)
        {
            // 1. نجيب العقار عشان نعرف مين البروكر بتاعه
            var property = await _context.Properties.FindAsync(dto.PropertyId);
            if (property == null) return NotFound("Property not found");

            // 2. هل العميل ده متسجل عندنا قبل كده؟ (برقم الموبايل)
            var existingLead = await _context.Leads.FirstOrDefaultAsync(l => l.PhoneNumber == dto.ClientPhone);

            int leadId;

            if (existingLead == null)
            {
                // عميل جديد تماماً
                var newLead = new Lead
                {
                    FullName = dto.ClientName,
                    PhoneNumber = dto.ClientPhone,
                    Email = dto.ClientEmail,
                    BrokerId = property.BrokerId, // تعيين للبروكر صاحب العقار
                    LeadStatusId = 1, // رقم 1 مثلاً بيمثل حالة "New"
                    CreatedAt = DateTime.UtcNow
                };
                _context.Leads.Add(newLead);
                await _context.SaveChangesAsync();
                leadId = newLead.Id;

                // نسجله في الـ History (Chatter زي Odoo)
                _context.LeadStatusHistories.Add(new LeadStatusHistory
                {
                    LeadId = leadId,
                    OldStatusId = 0,
                    NewStatusId = 1,
                    ChangedById = property.BrokerId,
                    Notes = "Lead created automatically from website inquiry",
                    ChangedAt = DateTime.UtcNow
                });
            }
            else
            {
                // العميل موجود بالفعل، هنستخدم الـ ID بتاعه
                leadId = existingLead.Id;
            }

            // 3. نسجل الـ Request الخاص بالوحدة دي
            var request = new LeadRequest
            {
                LeadId = leadId,
                PropertyType = property.PropertyType.ToString(),
                TotalAmount = property.Price,

                // 👇 دول السطور اللي ضفناهم عشان الداتابيز مترفضش الطلب
                Purpose = "Unknown",
                PaymentMethod = "", // 👈 ده اللي كان عامل المشكلة
                PreferredLocation = "",

                Notes = $"Client inquired from website about Property ID {property.Id}. Message: {dto.Message}"
            };
            _context.LeadRequests.Add(request);

            // 4. نعمل Task (Activity) للبروكر عشان يكلمه في أسرع وقت
            var activity = new LeadActivity
            {
                LeadId = leadId,
                ActivityType = "Call",
                Summary = "Website Inquiry - Call ASAP",
                DueDate = DateTime.UtcNow.AddMinutes(30), // لازم يكلمه خلال نص ساعة
                AssignedToId = property.BrokerId,
                Notes = "Automated task from website inquiry."
            };
            _context.LeadActivities.Add(activity);

            await _context.SaveChangesAsync();

            // في المستقبل: هنا ممكن نضيف كود يبعت Notification بـ SignalR للبروكر

            return Ok(new { message = "Inquiry received and assigned to broker successfully." });
        }

        // 5. Endpoint: جلب كل تفاصيل العميل (Lead Details)
        // GET: api/crm/leads/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetLeadDetails(int id)
        {
            var lead = await _context.Leads
                .Include(l => l.Status)
                .Include(l => l.Broker)
                .Include(l => l.Campaign)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lead == null) return NotFound("Lead not found");

            var request = await _context.LeadRequests.FirstOrDefaultAsync(r => r.LeadId == id);
            var visits = await _context.Visits.Where(v => v.LeadId == id).ToListAsync();
            var history = await _context.LeadStatusHistories
                .Include(h => h.ChangedBy)
                .Where(h => h.LeadId == id)
                .OrderByDescending(h => h.ChangedAt)
                .ToListAsync();
            var activities = await _context.LeadActivities
                .Where(a => a.LeadId == id)
                .OrderBy(a => a.DueDate)
                .ToListAsync();

            var statuses = await _context.LeadStatuses.ToDictionaryAsync(s => s.Id, s => s.Name);

            // بنجمع كل الداتا في Object واحد ونبعته للفرونت إند
            return Ok(new
            {
                LeadInfo = new
                {
                    lead.Id,
                    lead.FullName,
                    lead.PhoneNumber,
                    lead.Email,
                    BrokerName = lead.Broker.UserName,
                    StatusName = lead.Status.Name,
                    CampaignName = lead.Campaign?.Name,
                    lead.ExpectedRevenue,
                    lead.Probability,
                    lead.CreatedAt
                },
                RequestDetails = request,
                Visits = visits,
                Activities = activities,
                StatusHistory = history.Select(h => new {
                    OldStatusName = statuses.ContainsKey(h.OldStatusId) ? statuses[h.OldStatusId] : "None",
                    NewStatusName = statuses.ContainsKey(h.NewStatusId) ? statuses[h.NewStatusId] : "Unknown",
                    ChangedBy = h.ChangedBy.UserName,
                    h.ChangedAt,
                    h.Notes
                })
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLead(int id)
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null) return NotFound("Lead not found");

            // مسح كل الداتا المربوطة بالعميل الأول لتفادي أخطاء الداتابيز
            var requests = _context.LeadRequests.Where(r => r.LeadId == id);
            _context.LeadRequests.RemoveRange(requests);

            var history = _context.LeadStatusHistories.Where(h => h.LeadId == id);
            _context.LeadStatusHistories.RemoveRange(history);

            var visits = _context.Visits.Where(v => v.LeadId == id);
            _context.Visits.RemoveRange(visits);

            var activities = _context.LeadActivities.Where(a => a.LeadId == id);
            _context.LeadActivities.RemoveRange(activities);

            // أخيراً مسح العميل نفسه
            _context.Leads.Remove(lead);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Lead deleted successfully" });
        }
    }
}