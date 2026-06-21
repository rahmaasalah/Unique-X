using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
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

            bool isDuplicate = await _context.Leads.AnyAsync(l => l.PhoneNumber == dto.PhoneNumber);

            // 1. إنشاء وحفظ الـ Lead الأساسي
            var newLead = new Lead
            {
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                Email = dto.Email,
                BrokerId = dto.BrokerId,
                CampaignSource = dto.CampaignSource,
                CampaignName = dto.CampaignName,
                LeadStatusId = dto.LeadStatusId,
                ReferredBy = dto.ReferredBy,
                IsDuplicate = isDuplicate, // لو متكرر هيبقى True
                IsApprovedDuplicate = !isDuplicate,
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
                Notes = dto.Notes ?? "",
                ZoneId = dto.ZoneId,
                SelectedRegions = dto.SelectedRegions ?? "",
                SelectedProjects = dto.SelectedProjects ?? "",
                DownPayment = dto.DownPayment,
                InstallmentYears = dto.InstallmentYears,
                QuarterlyInstallment = dto.QuarterlyInstallment
            };

            _context.LeadRequests.Add(newLeadRequest);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Lead and Request created successfully!",
                leadId = newLead.Id,
                isDuplicate = isDuplicate // 👈 السطر ده جديد
            });
        }

            // 2. Endpoint: عشان البروكر يجيب الـ Leads بتاعته (بالفلاتر)
            // GET: api/crm/leads?brokerId=123&statusId=5
            [HttpGet]
        public async Task<IActionResult> GetLeads([FromQuery] string? brokerId, [FromQuery] int? statusId)
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
                BrokerName = l.Broker.FirstName + " " + l.Broker.LastName,
                StatusId = l.LeadStatusId,
                GeneralFeedback = l.GeneralFeedback ?? "",
                StatusName = l.Status.Name,
                CampaignName = string.IsNullOrEmpty(l.CampaignName) ? "No Campaign" : l.CampaignName,
                CampaignSource = l.CampaignSource ?? "",
                ReferredBy = l.ReferredBy ?? "", // 👈 السطر ده جديد
                IsDuplicate = l.IsDuplicate,
                IsApprovedDuplicate = l.IsApprovedDuplicate,
                // بيحسب كام عميل مسجل بنفس الرقم ده وحالته 19 (Deal Closed)
                ClosedDealsCount = _context.Leads.Count(c => c.PhoneNumber == l.PhoneNumber && c.LeadStatusId == 19),
                CreatedAt = l.CreatedAt,
                QuarterlyInstallment = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).QuarterlyInstallment,

                // 👇 ده السطر اللي بيجيب تاريخ آخر تعديل، ولو مفيش بيجيب تاريخ الإنشاء
                UpdatedAt = l.UpdatedAt ?? l.CreatedAt,
                IsRejectedDuplicate = l.IsRejectedDuplicate,

                // 👇 بناخد آخر LeadRequest (الأحدث) عشان الـ Lead بقى ممكن يكون ليه أكتر من طلب
                PropertyType = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id) != null ? _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).PropertyType : "",
                Purpose = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id) != null ? _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).Purpose : "",
                TotalAmount = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id) != null ? (_context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).TotalAmount ?? 0) : 0,
                PreferredLocation = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id) != null ? _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).PreferredLocation : "Not Specified",
                SelectedRegions = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id) != null ? _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).SelectedRegions : "",
                SelectedProjects = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id) != null ? _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).SelectedProjects : "",
                Notes = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id) != null ? _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).Notes : "",

                ZoneName = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id) == null ? "N/A" :
                       _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).ZoneId == 1 ? "Cairo" :
                       _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).ZoneId == 2 ? "Alexandria" :
                       _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).ZoneId == 3 ? "North Coast" : "N/A",

                // 👇 الحقول المالية الجديدة
                PaymentMethod = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id) != null ? _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).PaymentMethod : "",
                DownPayment = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).DownPayment,
                InstallmentYears = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).InstallmentYears,
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
            lead.UpdatedAt = DateTime.UtcNow; // ✅ السطر ده بس المحتاج
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
            var existingLead = await _context.Leads.FirstOrDefaultAsync(l =>
    l.PhoneNumber == dto.ClientPhone && l.CampaignName == property.Code);

            int leadId;
            bool isNewLead = existingLead == null;

            if (isNewLead)
            {
                // عميل جديد تماماً
                var newLead = new Lead
                {
                    FullName = dto.ClientName,
                    PhoneNumber = dto.ClientPhone,
                    Email = dto.ClientEmail,
                    BrokerId = property.BrokerId, // تعيين للبروكر صاحب العقار
                    LeadStatusId = 1, // رقم 1 مثلاً بيمثل حالة "New"
                    CampaignSource = "Website", // المصدر: استفسار من الموقع
                    CampaignName = property.Code, // كود الوحدة اللي استفسر عنها أول مرة
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
                // العميل موجود بالفعل، هنستخدم نفس الـ Lead ID (Lead واحد يجمع كل استفساراته)
                leadId = existingLead.Id;

                // لو الـ Lead مكنش له مصدر حملة متسجل قبل كده، نسجله كـ Website
                if (string.IsNullOrEmpty(existingLead.CampaignSource))
                {
                    existingLead.CampaignSource = "Website";
                    existingLead.CampaignName = property.Code;
                }
                existingLead.UpdatedAt = DateTime.UtcNow;
            }

            // 3. نسجل الـ Request الخاص بالوحدة دي (حتى لو نفس العميل، بنسجل كل وحدة استفسر عنها)
            var request = new LeadRequest
            {
                LeadId = leadId,
                PropertyType = property.PropertyType.ToString(),
                TotalAmount = property.Price,

                Purpose = property.ListingType.ToString(), // 👈 بقى ياخد Listing Type الحقيقي للوحدة (Primary/Resale)
                PaymentMethod = "", // 👈 ده اللي كان عامل المشكلة
                PreferredLocation = "",

                Notes = $"Client inquired from website about Property Code: {property.Code ?? property.Id.ToString()}. Message: {dto.Message}"
            };
            _context.LeadRequests.Add(request);

            // 4. نعمل Task (Activity) للبروكر عشان يكلمه في أسرع وقت
            //var activity = new LeadActivity
            //{
            //    LeadId = leadId,
            //    ActivityType = "Call",
            //    ListingType = property.ListingType.ToString(), // 👈 العمود ده NOT NULL في الداتابيز
            //    Summary = isNewLead
            //        ? "Website Inquiry - Call ASAP"
            //        : $"Website Inquiry - New unit interest ({property.Code}) - Call ASAP",
            //    DueDate = DateTime.UtcNow.AddMinutes(30), // لازم يكلمه خلال نص ساعة
            //    AssignedToId = property.BrokerId,
            //    Notes = $"Automated task from website inquiry. Property Code: {property.Code ?? property.Id.ToString()}"
            //};
            //_context.LeadActivities.Add(activity);

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
                    // 👇 التعديل الأول: عرض اسم البروكر بدل الإيميل
                    BrokerName = lead.Broker.FirstName + " " + lead.Broker.LastName,
                    StatusId = lead.LeadStatusId,
                    StatusName = lead.Status.Name,
                    CampaignId = lead.CampaignId,
                    CampaignName = string.IsNullOrEmpty(lead.CampaignName) ? "No Campaign" : lead.CampaignName,
                    CampaignSource = lead.CampaignSource ?? "",
                    ReferredBy = lead.ReferredBy ?? "",
                    GeneralFeedback = lead.GeneralFeedback ?? "",
                    lead.CreatedAt,
                    UpdatedAt = history.Any() ? history.First().ChangedAt : lead.CreatedAt
                },
                RequestDetails = new
                {
                    request?.PropertyType,
                    request?.Purpose,
                    request?.TotalAmount,
                    request?.PaymentMethod,
                    request?.DownPayment,
                    request?.InstallmentYears,
                    request?.QuarterlyInstallment,
                    ZoneId = request?.ZoneId,
                    ZoneName = request?.ZoneId == 1 ? "Cairo" : request?.ZoneId == 2 ? "Alexandria" : request?.ZoneId == 3 ? "North Coast" : "",
                    request?.SelectedRegions,
                    request?.SelectedProjects,
                    request?.PreferredLocation,
                    request?.Notes
                },
                Visits = visits,
                Activities = activities,
                StatusHistory = history.Select(h => new {
                    OldStatusName = statuses.ContainsKey(h.OldStatusId) ? statuses[h.OldStatusId] : "None",
                    NewStatusName = statuses.ContainsKey(h.NewStatusId) ? statuses[h.NewStatusId] : "Unknown",
                    ChangedBy = h.ChangedBy.FirstName + " " + h.ChangedBy.LastName,
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

        [HttpPut("{id}/update-details")]
        public async Task<IActionResult> UpdateLeadDetails(int id, [FromBody] UpdateLeadDetailsDto dto)
        {
            // 1. تحديث بيانات العميل الأساسية
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null) return NotFound("Lead not found");

            // 👇 السحر هنا: لو البروكر غير الحالة من جوه صفحة التعديل، نسجلها في الـ History فوراً
            if (lead.LeadStatusId != dto.LeadStatusId)
            {
                var history = new LeadStatusHistory
                {
                    LeadId = lead.Id,
                    OldStatusId = lead.LeadStatusId,
                    NewStatusId = dto.LeadStatusId,
                    ChangedById = lead.BrokerId,
                    Notes = "Stage updated from Edit Request Form", // رسالة توضح إنها اتعدلت من الفورم
                    ChangedAt = DateTime.UtcNow
                };
                _context.LeadStatusHistories.Add(history);
            }

            lead.FullName = dto.FullName;
            lead.PhoneNumber = dto.PhoneNumber;
            lead.Email = dto.Email;
            lead.LeadStatusId = dto.LeadStatusId;
            lead.CampaignSource = dto.CampaignSource;
            lead.CampaignName = dto.CampaignName;
            lead.ReferredBy = dto.ReferredBy;

            _context.Leads.Update(lead);

            // 2. تحديث الطلب العقاري
            var request = await _context.LeadRequests.FirstOrDefaultAsync(r => r.LeadId == id);
            if (request != null)
            {
                request.PropertyType = dto.PropertyType;
                request.Purpose = dto.Purpose;
                request.TotalAmount = dto.TotalAmount;
                request.PaymentMethod = dto.PaymentMethod ?? "";
                request.ZoneId = dto.ZoneId;
                request.SelectedRegions = dto.SelectedRegions ?? "";
                request.SelectedProjects = dto.SelectedProjects ?? "";
                request.DownPayment = dto.DownPayment;
                request.InstallmentYears = dto.InstallmentYears;
                request.QuarterlyInstallment = dto.QuarterlyInstallment;
                request.PreferredLocation = dto.PreferredLocation ?? "";
                request.Notes = dto.Notes ?? "";

                _context.LeadRequests.Update(request);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Lead updated successfully!" });
        }
        [HttpPost("{id}/add-note")]
        public async Task<IActionResult> AddGeneralNote(int id, [FromBody] string note, [FromQuery] string brokerId)
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null) return NotFound("Lead not found");

            // 1. نجيب اسم البروكر اللي كتب الفيدباك
            var broker = await _context.Users.FindAsync(brokerId);
            string brokerName = broker != null ? $"{broker.FirstName} {broker.LastName}" : "Unknown Broker";

            // 2. نجيب التاريخ بصيغة عالمية عشان Angular يعرف يحولها لمصر
            string dateStr = DateTime.UtcNow.ToString("o");

            // 3. ندمجهم بفاصل سري (عشان لو العميل كتب أي علامات عادية متأثرش)
            string newEntry = $"{brokerName}_#|#_{dateStr}_#|#_{note}";

            // 4. بنحط الفيدباك الجديد في الأول، وبعدين القديم، عشان يترتب من الأحدث للأقدم
            lead.GeneralFeedback = string.IsNullOrEmpty(lead.GeneralFeedback)
                ? newEntry
                : newEntry + "_@|@_" + lead.GeneralFeedback;

            _context.Leads.Update(lead);
            await _context.SaveChangesAsync();

            lead.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Note added successfully" });
        }

        // 1. نظام الترشيحات الذكي (Recommendation Engine)
        [HttpGet("{id}/recommendations")]
        public async Task<IActionResult> GetRecommendations(int id)
        {
            var request = await _context.LeadRequests.FirstOrDefaultAsync(r => r.LeadId == id);

            // لو مفيش طلب أو مفيش ميزانية، نرجع لستة فاضية
            if (request == null || !request.TotalAmount.HasValue || request.TotalAmount.Value <= 0)
                return Ok(new List<object>());

            decimal baseAmount = request.TotalAmount.Value;
            decimal minBudget;
            decimal maxBudget;

            // 🟢 التعديل السحري هنا: فحص لو نوع العقار "فيلا"
            if (!string.IsNullOrEmpty(request.PropertyType) && request.PropertyType.Replace(" ", "").Equals("Villa", StringComparison.OrdinalIgnoreCase))
            {
                minBudget = baseAmount - 5000000m; // أقل بـ 5 مليون للفيلا
                maxBudget = baseAmount + 5000000m; // أكثر بـ 5 مليون للفيلا
            }
            else
            {
                // الرينج العادي لباقي أنواع العقارات
                minBudget = baseAmount - 200000m;
                maxBudget = baseAmount + 600000m;
            }

            if (minBudget < 0) minBudget = 0;

            // بنجيب العقارات اللي البروكر اقترحها قبل كده
            var proposedIds = string.IsNullOrEmpty(request.ProposedPropertyIds)
                ? new List<string>()
                : request.ProposedPropertyIds.Split(',').ToList();

            // البناء الديناميكي للبحث بصرامة (Strict Matching)
            var query = _context.Properties.Where(p => p.IsActive && p.IsApproved && !p.IsSold);

            // -- أ) فلتر الميزانية (Range)
            query = query.Where(p => p.Price >= minBudget && p.Price <= maxBudget);

            // -- ب) فلتر طريقة الدفع (تطابق تام)
            if (!string.IsNullOrEmpty(request.PaymentMethod))
            {
                query = query.Where(p => p.PaymentMethod == request.PaymentMethod);

                // 🟢 التعديل الجديد: الفلتر المالي الدقيق (المقدم والقسط) في حالة التقسيط
                if (request.PaymentMethod == "Installment")
                {
                    // 1. فلتر المقدم (Down Payment): أكبر أو أقل بـ 400,000
                    if (request.DownPayment.HasValue && request.DownPayment.Value > 0)
                    {
                        decimal minDp = Math.Max(0, request.DownPayment.Value - 400000m); // Math.Max عشان الرقم مينزلش تحت الصفر
                        decimal maxDp = request.DownPayment.Value + 400000m;

                        // بنبحث جوه خطط الدفع بتاعت العقار
                        query = query.Where(p => p.PaymentPlans.Any(plan => plan.DownPayment >= minDp && plan.DownPayment <= maxDp));
                    }

                    // 2. فلتر القسط الربع سنوي (Quarterly Installment): أكبر أو أقل بـ 70,000
                    if (request.QuarterlyInstallment.HasValue && request.QuarterlyInstallment.Value > 0)
                    {
                        decimal minQi = Math.Max(0, request.QuarterlyInstallment.Value - 70000m);
                        decimal maxQi = request.QuarterlyInstallment.Value + 70000m;

                        // بنبحث جوه خطط الدفع بتاعت العقار
                        query = query.Where(p => p.PaymentPlans.Any(plan => plan.QuarterInstallment >= minQi && plan.QuarterInstallment <= maxQi));
                    }
                }
            }

            // -- ج) فلتر الغرض / نوع العرض (Primary, Resale, Rent)
            if (!string.IsNullOrEmpty(request.Purpose))
            {
                string purposeClean = request.Purpose.Replace(" ", "");
                if (Enum.TryParse(typeof(PropEnums.ListingType), purposeClean, true, out var parsedListingType))
                {
                    var listingEnum = (PropEnums.ListingType)parsedListingType;
                    query = query.Where(p => p.ListingType == listingEnum);
                }
            }

            // -- د) فلتر نوع العقار (تطابق تام - Apartment, Villa, etc)
            if (!string.IsNullOrEmpty(request.PropertyType))
            {
                string typeClean = request.PropertyType.Replace(" ", "");
                if (Enum.TryParse(typeof(PropEnums.PropertyType), typeClean, true, out var parsedType))
                {
                    var typeEnum = (PropEnums.PropertyType)parsedType;
                    query = query.Where(p => p.PropertyType == typeEnum);
                }
            }

            // -- هـ) فلتر المحافظة (الـ Zone) 
            if (request.ZoneId.HasValue && request.ZoneId.Value > 0)
            {
                query = query.Where(p => (int)p.City == request.ZoneId.Value);
            }

            // -- و) فلتر المناطق والمشاريع (تطابق تام في النطاق المحدد)
            var regionsList = string.IsNullOrEmpty(request.SelectedRegions)
                ? new List<string>()
                : request.SelectedRegions.Split(new[] { ", " }, StringSplitOptions.RemoveEmptyEntries).Select(r => r.Trim()).ToList();

            var projectsList = string.IsNullOrEmpty(request.SelectedProjects)
                ? new List<string>()
                : request.SelectedProjects.Split(new[] { ", " }, StringSplitOptions.RemoveEmptyEntries).Select(p => p.Trim()).ToList();

            if (regionsList.Any() || projectsList.Any())
            {
                query = query.Where(p =>
                    (regionsList.Any() && p.Region != null && regionsList.Contains(p.Region)) ||
                    (projectsList.Any() && p.ProjectName != null && projectsList.Contains(p.ProjectName))
                );
            }

            // 3. استبعاد العقارات التي تم اقتراحها مسبقاً (اختياري، خليتها هنا عشان ميظهرش القديم)
            if (proposedIds.Any())
            {
                var proposedIntIds = proposedIds.Select(id => int.TryParse(id, out int res) ? res : 0).Where(id => id > 0).ToList();
                query = query.Where(p => !proposedIntIds.Contains(p.Id));
            }

            // 4. ترتيب وتجهيز الخرج للفرونت إند
            var recommendations = await query
                .OrderByDescending(p => p.CreatedAt)
                .Take(12)
                .Select(p => new {
                    Id = p.Id,
                    Code = p.Code ?? ("PROP-" + p.Id),
                    Title = p.Title,
                    Price = p.Price,
                    IsProposed = proposedIds.Contains(p.Id.ToString())
                })
                .ToListAsync();

            return Ok(recommendations);
        }

        // 2. تسجيل العقار كـ (تم اقتراحه للعميل)
        [HttpPut("{id}/mark-proposed/{propertyId}")]
        public async Task<IActionResult> MarkPropertyProposed(int id, int propertyId)
        {
            var request = await _context.LeadRequests.FirstOrDefaultAsync(r => r.LeadId == id);
            if (request == null) return NotFound();

            var proposedList = string.IsNullOrEmpty(request.ProposedPropertyIds)
                ? new List<string>()
                : request.ProposedPropertyIds.Split(',').ToList();

            if (!proposedList.Contains(propertyId.ToString()))
            {
                proposedList.Add(propertyId.ToString());
                request.ProposedPropertyIds = string.Join(",", proposedList);
                _context.LeadRequests.Update(request);
                await _context.SaveChangesAsync();
            }

            return Ok();
        }

        [HttpPost("upload-bulk")]
        public async Task<IActionResult> UploadBulkLeads(IFormFile file, [FromQuery] string brokerId)
        {
            if (file == null || file.Length == 0) return BadRequest("Please upload a valid CSV file.");
            if (string.IsNullOrEmpty(brokerId)) return BadRequest("Broker ID is required.");

            var newLeadsCount = 0;

            using (var stream = new StreamReader(file.OpenReadStream()))
            {
                // قراءة أول سطر (الهيدر) وتجاهله
                await stream.ReadLineAsync();

                while (!stream.EndOfStream)
                {
                    var line = await stream.ReadLineAsync();
                    var values = line.Split(',');

                    // نتأكد إن السطر فيه على الأقل (الاسم والرقم)
                    if (values.Length >= 2 && !string.IsNullOrWhiteSpace(values[0]) && !string.IsNullOrWhiteSpace(values[1]))
                    {
                        var phone = values[1].Trim();

                        // نتأكد إن العميل ده مش متسجل قبل كده بنفس الرقم
                        bool isDuplicate = await _context.Leads.AnyAsync(l => l.PhoneNumber == phone);
                            var newLead = new Lead
                            {
                                FullName = values[0].Trim(),
                                PhoneNumber = phone,
                                Email = values.Length > 2 ? values[2].Trim() : "",
                                BrokerId = brokerId,
                                LeadStatusId = 1, // New
                                CreatedAt = DateTime.UtcNow
                            };
                            _context.Leads.Add(newLead);
                            await _context.SaveChangesAsync();

                            // إضافة Request افتراضي للعميل ده
                            _context.LeadRequests.Add(new LeadRequest
                            {
                                LeadId = newLead.Id,
                                PropertyType = values.Length > 3 ? values[3].Trim() : "Apartment",
                                Purpose = "Sale",
                                PaymentMethod = "Cash",
                                Notes = "Imported via Bulk CSV Upload"
                            });
                            await _context.SaveChangesAsync();

                            // إضافة هيستوري
                            _context.LeadStatusHistories.Add(new LeadStatusHistory
                            {
                                LeadId = newLead.Id,
                                OldStatusId = 0,
                                NewStatusId = 1,
                                ChangedById = brokerId,
                                Notes = "Imported from CSV Sheet",
                                ChangedAt = DateTime.UtcNow
                            });
                            newLeadsCount++;
                        
                    }
                }
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = $"{newLeadsCount} leads imported successfully!" });
        }

        [HttpPut("{id}/transfer")]
        public async Task<IActionResult> TransferLead(int id, [FromBody] TransferLeadDto dto, [FromQuery] string adminId)
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null) return NotFound("Lead not found");

            lead.BrokerId = dto.NewBrokerId;
            _context.Leads.Update(lead);

            // نقل المهام والزيارات المعلقة للبروكر الجديد
            var pendingActivities = await _context.LeadActivities.Where(a => a.LeadId == id && a.Status == "Pending").ToListAsync();
            foreach (var activity in pendingActivities) { activity.AssignedToId = dto.NewBrokerId; }

            var pendingVisits = await _context.Visits.Where(v => v.LeadId == id && v.Status == "Pending").ToListAsync();
            foreach (var visit in pendingVisits) { visit.BrokerId = dto.NewBrokerId; }

            // تسجيل حركة النقل في الـ History
            _context.LeadStatusHistories.Add(new LeadStatusHistory
            {
                LeadId = lead.Id,
                OldStatusId = lead.LeadStatusId,
                NewStatusId = lead.LeadStatusId,
                ChangedById = adminId,
                Notes = "Admin transferred this lead to a new broker.",
                ChangedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Lead transferred successfully!" });
        }

        [HttpPut("{id}/approve-duplicate")]
        public async Task<IActionResult> ApproveDuplicate(int id)
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null) return NotFound();

            lead.IsApprovedDuplicate = true;
            _context.Leads.Update(lead);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Duplicate lead approved successfully." });
        }

        [HttpGet("property-codes")]
        public async Task<IActionResult> GetPropertyCodesByListingType([FromQuery] string purpose)
        {
            var query = _context.Properties.Where(p => p.IsActive && p.IsApproved && !p.IsSold);

            if (!string.IsNullOrEmpty(purpose))
            {
                string purposeClean = purpose.Replace(" ", "");
                if (Enum.TryParse(typeof(PropEnums.ListingType), purposeClean, true, out var parsedListingType))
                {
                    var listingEnum = (PropEnums.ListingType)parsedListingType;
                    query = query.Where(p => p.ListingType == listingEnum);
                }
            }

            var codes = await query.Select(p => p.Code).Where(c => !string.IsNullOrEmpty(c)).Distinct().ToListAsync();
            return Ok(codes);
        }

        [HttpPut("bulk-transfer")]
        public async Task<IActionResult> BulkTransferLeads([FromBody] BulkTransferDto dto, [FromQuery] string adminId)
        {
            if (dto.LeadIds == null || !dto.LeadIds.Any() || string.IsNullOrEmpty(dto.NewBrokerId))
                return BadRequest("Invalid data provided.");

            var leads = await _context.Leads.Where(l => dto.LeadIds.Contains(l.Id)).ToListAsync();

            foreach (var lead in leads)
            {
                lead.BrokerId = dto.NewBrokerId;

                // نقل المهام المعلقة
                var pendingActivities = await _context.LeadActivities.Where(a => a.LeadId == lead.Id && a.Status == "Pending").ToListAsync();
                foreach (var activity in pendingActivities) { activity.AssignedToId = dto.NewBrokerId; }

                // نقل الزيارات المعلقة
                var pendingVisits = await _context.Visits.Where(v => v.LeadId == lead.Id && v.Status == "Pending").ToListAsync();
                foreach (var visit in pendingVisits) { visit.BrokerId = dto.NewBrokerId; }

                // تسجيل الهيستوري
                _context.LeadStatusHistories.Add(new LeadStatusHistory
                {
                    LeadId = lead.Id,
                    OldStatusId = lead.LeadStatusId,
                    NewStatusId = lead.LeadStatusId,
                    ChangedById = adminId,
                    Notes = "Admin bulk-transferred this lead to a new broker.",
                    ChangedAt = DateTime.UtcNow
                });
            }

            _context.Leads.UpdateRange(leads);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"{leads.Count} leads transferred successfully!" });
        }
    }
}