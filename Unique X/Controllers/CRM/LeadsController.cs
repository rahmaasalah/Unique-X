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

            // فلتر بالبروكر: بنجيب عملاء البروكر الحاليين + العملاء اللي اتسحبوا منه قبل كده (عشان يظهروا كـ Disappeared)
            if (!string.IsNullOrEmpty(brokerId))
            {
                query = query.Where(l => l.BrokerId == brokerId || l.PreviousBrokerId == brokerId);
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
                LastActionBy = l.LastActionBy ?? "broker",
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
                RescheduledActivities = _context.LeadActivities.Count(a => a.LeadId == l.Id && a.Status == "Rescheduled"),

                BrokerId = l.BrokerId,
                PreviousBrokerId = l.PreviousBrokerId,
                IsUnassigned = l.IsUnassigned,

                // 🟢 حقول Get Recommendation
                SelectedCities = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id) != null ? _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).SelectedCities : "",
                MinRooms = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).MinRooms,
                MaxRooms = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).MaxRooms,
                MinBathrooms = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).MinBathrooms,
                MaxBathrooms = _context.LeadRequests.OrderByDescending(r => r.Id).FirstOrDefault(r => r.LeadId == l.Id).MaxBathrooms,

                // 🟢 لسه على الأكاونت المؤقت (عبدالرحمن أشرف) ولسه محددش بروكر حقيقي
                IsNewFromWebsite = l.Broker.Email == "uniquexxxxxxx@gmail.com"
            }).ToListAsync();

            // ============================================================
            // 🟢 حساب Late/TooLate + هل العميل جاله Transfer من الأدمن قبل كده
            // (بنعملها في خطوة منفصلة بسيطة وسريعة بدل Subqueries معقدة جوه الـ Select)
            // ============================================================
            var lateCutoff = DateTime.UtcNow.AddHours(-24);
            var tooLateCutoff = DateTime.UtcNow.AddHours(-48);

            var tooLateLeadIds = (await _context.LeadActivities
                    .Where(a => a.Status == "Pending" && a.DueDate <= tooLateCutoff)
                    .Select(a => a.LeadId).Distinct().ToListAsync())
                .Union(await _context.Visits
                    .Where(v => v.Status == "Pending" && v.VisitDate <= tooLateCutoff)
                    .Select(v => v.LeadId).Distinct().ToListAsync())
                .ToHashSet();

            var lateLeadIds = (await _context.LeadActivities
                    .Where(a => a.Status == "Pending" && a.DueDate <= lateCutoff && a.DueDate > tooLateCutoff)
                    .Select(a => a.LeadId).Distinct().ToListAsync())
                .Union(await _context.Visits
                    .Where(v => v.Status == "Pending" && v.VisitDate <= lateCutoff && v.VisitDate > tooLateCutoff)
                    .Select(v => v.LeadId).Distinct().ToListAsync())
                .ToHashSet();

            var transferredInLeadIds = (await _context.LeadStatusHistories
                    .Where(h => h.Notes != null && (h.Notes.Contains("Admin transferred") || h.Notes.Contains("Admin assigned this lead to a new broker")))
                    .Select(h => h.LeadId).Distinct().ToListAsync())
                .ToHashSet();

            foreach (var l in leads)
            {
                l.LateStatus = tooLateLeadIds.Contains(l.Id) ? "TooLate" : (lateLeadIds.Contains(l.Id) ? "Late" : "OnTime");
                l.IsTransferredIn = transferredInLeadIds.Contains(l.Id);
            }

            // لو بنجيب ليستة بروكر معين، أي عميل اتسحب منه (PreviousBrokerId == هو) وبقى دلوقتي عند بروكر تاني (BrokerId != هو)
            // لازم يظهر عنده كـ "Disappeared" بس - اسم فقط من غير أي بيانات
            if (!string.IsNullOrEmpty(brokerId))
            {
                leads = leads.Select(l =>
                {
                    bool isDisappearedForCaller = l.PreviousBrokerId == brokerId && l.BrokerId != brokerId;
                    if (!isDisappearedForCaller) return l;

                    return new LeadResponseDto
                    {
                        Id = l.Id,
                        FullName = l.FullName,
                        IsDisappeared = true
                    };
                }).ToList();
            }

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
            lead.UpdatedAt = DateTime.UtcNow;
            lead.LastActionBy = (dto.IsAdminAction == true) ? "admin" : "broker";
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

        // 🟢 Endpoint: زرار "Visit Now" في كارت الوحدة — العميل بيحدد ميعاد بنفسه من الموقع
        // نفس منطق website-inquiry بالظبط (نفس الـ Lead لو موجود برقمه وكود الوحدة)، وبالإضافة كمان بيعمل Visit فعلية
        [HttpPost("website-visit-request")]
        public async Task<IActionResult> RequestVisitFromWebsite([FromBody] RequestVisitDto dto)
        {
            var property = await _context.Properties.FindAsync(dto.PropertyId);
            if (property == null) return NotFound("Property not found");

            var existingLead = await _context.Leads.FirstOrDefaultAsync(l =>
                l.PhoneNumber == dto.ClientPhone && l.CampaignName == property.Code);

            int leadId;
            bool isNewLead = existingLead == null;

            if (isNewLead)
            {
                var newLead = new Lead
                {
                    FullName = dto.ClientName,
                    PhoneNumber = dto.ClientPhone,
                    Email = dto.ClientEmail,
                    BrokerId = property.BrokerId, // تعيين للبروكر صاحب العقار
                    LeadStatusId = 1,
                    CampaignSource = "Website",
                    CampaignName = property.Code,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Leads.Add(newLead);
                await _context.SaveChangesAsync();
                leadId = newLead.Id;

                _context.LeadStatusHistories.Add(new LeadStatusHistory
                {
                    LeadId = leadId,
                    OldStatusId = 0,
                    NewStatusId = 1,
                    ChangedById = property.BrokerId,
                    Notes = "Lead created automatically from a website visit request",
                    ChangedAt = DateTime.UtcNow
                });
            }
            else
            {
                leadId = existingLead.Id;
                if (string.IsNullOrEmpty(existingLead.CampaignSource))
                {
                    existingLead.CampaignSource = "Website";
                    existingLead.CampaignName = property.Code;
                }
                existingLead.UpdatedAt = DateTime.UtcNow;
                existingLead.LastActionBy = "broker";
            }

            // نسجل طلب الوحدة دي (زي website-inquiry بالظبط)
            var request = new LeadRequest
            {
                LeadId = leadId,
                PropertyType = property.PropertyType.ToString(),
                TotalAmount = property.Price,
                Purpose = property.ListingType.ToString(),
                PaymentMethod = "",
                PreferredLocation = "",
                Notes = $"Client requested a visit for Property Code: {property.Code ?? property.Id.ToString()}." +
                         (string.IsNullOrWhiteSpace(dto.Notes) ? "" : $" Notes: {dto.Notes}")
            };
            _context.LeadRequests.Add(request);

            // 🟢 الزيارة الفعلية بالميعاد اللي العميل اختاره بنفسه
            var visit = new Visit
            {
                LeadId = leadId,
                BrokerId = property.BrokerId,
                VisitDate = dto.VisitDate,
                Location = !string.IsNullOrWhiteSpace(property.Address) ? property.Address : (property.Region ?? ""),
                Status = "Pending",
                IsCompleted = false,
                Feedback = "",
                PropertyCode = property.Code,
                PropertyName = property.ProjectName ?? property.Title,
                ZoneId = (int)property.City,
                ListingType = property.ListingType.ToString(),
                Region = property.Region,
                Project = property.ProjectName,
                Notes = dto.Notes,
                ContactPhone = string.IsNullOrWhiteSpace(dto.ContactPhone) ? dto.ClientPhone : dto.ContactPhone,
                VisitType = string.IsNullOrWhiteSpace(dto.VisitType) ? "Client" : dto.VisitType,
                // 👇 البادج "Client-booked" في صفحة lead-details بيعتمد على القيمة دي بالظبط
                // لو اختارت "Client" من المودال -> true (يظهر إنه العميل هو اللي حجز)
                // لو اختارت "Broker" -> false (يبقى زي أي زيارة بيسجلها البروكر بنفسه)
                IsClientInitiated = dto.VisitType == "Client"
            };
            _context.Visits.Add(visit);

            var lead = await _context.Leads.FindAsync(leadId);
            if (lead != null) { lead.UpdatedAt = DateTime.UtcNow; lead.LastActionBy = "broker"; }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Visit request received successfully!", leadId, visitId = visit.Id });
        }

        // ============================================================
        // 🟢 Endpoint: مودال "Get Recommendation" في الهوم/الناف بار
        // العميل بيملى مواصفاته العامة (مش عن وحدة معينة زي website-inquiry) - بيتسجل كـ Lead
        // ولو موجود بالفعل، بيتحدث الـ Request بتاعه (Merge) بدل ما ننشئ Lead جديد
        // ============================================================
        [HttpPost("website-recommendation")]
        public async Task<IActionResult> ReceiveRecommendationLead([FromBody] RecommendationLeadDto dto)
        {
            // 🟢 خرائط تحويل الكودات القادمة من المودال لأسماء واضحة تتخزن في الـ CRM
            var cityMap = new Dictionary<string, string> { { "1", "Cairo" }, { "2", "Alexandria" }, { "3", "North Coast" } };
            var listingTypeMap = new Dictionary<string, string> { { "0", "Resale" }, { "1", "Rent" }, { "2", "Primary" }, { "3", "Resale Project" } };
            var propertyTypeMap = new Dictionary<string, string> { { "0", "Apartment" }, { "1", "Villa" }, { "2", "Shop" }, { "3", "Office" }, { "4", "Chalet" }, { "5", "Full Floor" } };

            var newCities = (dto.Cities ?? new List<string>()).Select(c => cityMap.GetValueOrDefault(c, c)).Distinct().ToList();
            var newListingTypes = (dto.ListingTypes ?? new List<string>()).Select(l => listingTypeMap.GetValueOrDefault(l, l)).Distinct().ToList();
            var newPropertyTypes = (dto.PropertyTypes ?? new List<string>()).Select(p => propertyTypeMap.GetValueOrDefault(p, p)).Distinct().ToList();

            // 🟢 دالة صغيرة بتدمج قيمة Comma-separated قديمة مع ليستة جديدة من غير تكرار
            List<string> MergeCsv(string? existingCsv, List<string> newValues)
            {
                var existing = string.IsNullOrWhiteSpace(existingCsv)
                    ? new List<string>()
                    : existingCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
                return existing.Union(newValues).Distinct().ToList();
            }

            var lead = await _context.Leads.FirstOrDefaultAsync(l => l.PhoneNumber == dto.PhoneNumber);
            int leadId;
            bool isNewLead = lead == null;

            if (isNewLead)
            {
                // 🟢 نلاقي أكاونت "عبدالرحمن أشرف" - كل الليدز الجديدة من المودال بتتسجل عليه مؤقتًا
                // لحد ما الأدمن يوزعها من تاب "New Leads"
                var placeholderBroker = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == "uniquexxxxxxx@gmail.com" || u.PhoneNumber == "01200394564") as ApplicantUser;

                if (placeholderBroker == null)
                    return BadRequest("Placeholder broker account not found. Please contact support.");

                var newLead = new Lead
                {
                    FullName = dto.FullName,
                    PhoneNumber = dto.PhoneNumber,
                    Email = dto.Email,
                    BrokerId = placeholderBroker.Id,
                    LeadStatusId = 1, // New "To Call"
                    CampaignSource = "Recommendation",
                    CampaignName = "Get Recommendation",
                    CreatedAt = DateTime.UtcNow,
                    LastActionBy = "client"
                };
                _context.Leads.Add(newLead);
                await _context.SaveChangesAsync();
                leadId = newLead.Id;

                _context.LeadStatusHistories.Add(new LeadStatusHistory
                {
                    LeadId = leadId,
                    OldStatusId = 0,
                    NewStatusId = 1,
                    ChangedById = placeholderBroker.Id,
                    Notes = "Lead created automatically from website 'Get Recommendation' request",
                    ChangedAt = DateTime.UtcNow
                });

                var newRequest = new LeadRequest
                {
                    LeadId = leadId,
                    PropertyType = string.Join(",", newPropertyTypes),
                    Purpose = string.Join(",", newListingTypes),
                    SelectedCities = string.Join(",", newCities),
                    MinBudget = dto.MinBudget ?? 0,
                    MaxBudget = dto.MaxBudget ?? 0,
                    MinRooms = dto.MinRooms,
                    MaxRooms = dto.MaxRooms,
                    MinBathrooms = dto.MinBathrooms,
                    MaxBathrooms = dto.MaxBathrooms,
                    PaymentMethod = "",
                    PreferredLocation = "",
                    Notes = "Submitted via website 'Get Recommendation' form."
                };
                _context.LeadRequests.Add(newRequest);
            }
            else
            {
                leadId = lead.Id;
                lead.UpdatedAt = DateTime.UtcNow;
                lead.LastActionBy = "client";
                // لو ملوش إيميل متسجل وبعت واحد دلوقتي، نضيفه
                if (string.IsNullOrEmpty(lead.Email) && !string.IsNullOrEmpty(dto.Email)) lead.Email = dto.Email;

                var request = await _context.LeadRequests.FirstOrDefaultAsync(r => r.LeadId == leadId);
                if (request == null)
                {
                    request = new LeadRequest { LeadId = leadId, PropertyType = "", Purpose = "", PaymentMethod = "", PreferredLocation = "", Notes = "" };
                    _context.LeadRequests.Add(request);
                }

                // 🟢 دمج (Merge) مش استبدال - أي بيانات جديدة برا بتتضاف على اللي موجود جوا من غير ما نمسح حاجة
                request.PropertyType = string.Join(",", MergeCsv(request.PropertyType, newPropertyTypes));
                request.Purpose = string.Join(",", MergeCsv(request.Purpose, newListingTypes));
                request.SelectedCities = string.Join(",", MergeCsv(request.SelectedCities, newCities));

                if (dto.MinRooms.HasValue) request.MinRooms = request.MinRooms.HasValue ? Math.Min(request.MinRooms.Value, dto.MinRooms.Value) : dto.MinRooms;
                if (dto.MaxRooms.HasValue) request.MaxRooms = request.MaxRooms.HasValue ? Math.Max(request.MaxRooms.Value, dto.MaxRooms.Value) : dto.MaxRooms;
                if (dto.MinBathrooms.HasValue) request.MinBathrooms = request.MinBathrooms.HasValue ? Math.Min(request.MinBathrooms.Value, dto.MinBathrooms.Value) : dto.MinBathrooms;
                if (dto.MaxBathrooms.HasValue) request.MaxBathrooms = request.MaxBathrooms.HasValue ? Math.Max(request.MaxBathrooms.Value, dto.MaxBathrooms.Value) : dto.MaxBathrooms;
                if (dto.MinBudget.HasValue) request.MinBudget = request.MinBudget > 0 ? Math.Min(request.MinBudget, dto.MinBudget.Value) : dto.MinBudget.Value;
                if (dto.MaxBudget.HasValue) request.MaxBudget = request.MaxBudget > 0 ? Math.Max(request.MaxBudget, dto.MaxBudget.Value) : dto.MaxBudget.Value;

                _context.LeadStatusHistories.Add(new LeadStatusHistory
                {
                    LeadId = leadId,
                    OldStatusId = lead.LeadStatusId,
                    NewStatusId = lead.LeadStatusId,
                    ChangedById = lead.BrokerId,
                    Notes = "Client submitted a new 'Get Recommendation' request from the website - request details updated.",
                    ChangedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Request received successfully!", leadId, isNewLead });
        }

        // ============================================================
        // 🟢 Endpoint: تاب "New Leads" في crm-dashboard - الليدز الجاية من المودال ولسه معلقة عند الأكاونت المؤقت
        // ============================================================
        [HttpGet("new-leads")]
        public async Task<IActionResult> GetNewLeads()
        {
            var leads = await _context.Leads
                .Include(l => l.Broker)
                .Include(l => l.Status)
                .Where(l => l.Broker.Email == "uniquexxxxxxx@gmail.com" && !l.IsUnassigned)
                .OrderByDescending(l => l.CreatedAt)
                .Select(l => new
                {
                    l.Id,
                    l.FullName,
                    l.PhoneNumber,
                    l.Email,
                    StatusName = l.Status.Name,
                    l.CampaignSource,
                    l.CreatedAt,
                    Request = _context.LeadRequests.Where(r => r.LeadId == l.Id).Select(r => new
                    {
                        r.PropertyType,
                        r.Purpose,
                        r.SelectedCities,
                        r.MinBudget,
                        r.MaxBudget,
                        r.MinRooms,
                        r.MaxRooms,
                        r.MinBathrooms,
                        r.MaxBathrooms
                    }).FirstOrDefault()
                })
                .ToListAsync();

            return Ok(leads);
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
                    // 👇 محتاجينه في الفرونت إند عشان نتأكد هل الليد ده بتاع البروكر اللي فاتح الصفحة ولا لأ
                    lead.BrokerId,
                    lead.IsUnassigned,
                    lead.PreviousBrokerId,
                    lead.FeedbackCounterResetAt,
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
                    request?.Notes,
                    // 🟢 حقول Get Recommendation
                    request?.SelectedCities,
                    request?.MinRooms,
                    request?.MaxRooms,
                    request?.MinBathrooms,
                    request?.MaxBathrooms,
                    request?.MinBudget,
                    request?.MaxBudget
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
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null) return NotFound("Lead not found");

            // ===== تحقق من تكرار الرقم لو اتغير =====
            bool phoneChanged = lead.PhoneNumber != dto.PhoneNumber;
            if (phoneChanged)
            {
                var existingLead = await _context.Leads
                    .Include(l => l.Broker)
                    .FirstOrDefaultAsync(l => l.PhoneNumber == dto.PhoneNumber && l.Id != id);

                if (existingLead != null)
                {
                    // في تكرار — نحفظ التغيير ونعلّم الـ lead إنه pending
                    lead.IsDuplicate = true;
                    lead.IsApprovedDuplicate = false;
                    lead.IsRejectedDuplicate = false;
                    lead.OriginalBrokerName = existingLead.Broker != null
                        ? existingLead.Broker.FirstName + " " + existingLead.Broker.LastName
                        : existingLead.BrokerId;

                    // نجيب اسم البروكر اللي عمل التعديل
                    var editingBroker = await _context.Users.FindAsync(lead.BrokerId) as ApplicantUser;
                    lead.DuplicateRequestedByBrokerName = editingBroker != null
                        ? editingBroker.FirstName + " " + editingBroker.LastName
                        : lead.BrokerId;

                    lead.PhoneNumber = dto.PhoneNumber;
                    lead.FullName = dto.FullName;
                    lead.Email = dto.Email;
                    lead.LeadStatusId = dto.LeadStatusId;
                    lead.CampaignSource = dto.CampaignSource;
                    lead.CampaignName = dto.CampaignName;
                    lead.ReferredBy = dto.ReferredBy;
                    _context.Leads.Update(lead);
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        message = "Duplicate detected. Pending admin approval.",
                        isDuplicate = true,
                        originalBrokerName = lead.OriginalBrokerName
                    });
                }
            }

            // 👇 السحر هنا: لو البروكر غير الحالة من جوه صفحة التعديل، نسجلها في الـ History فوراً
            if (lead.LeadStatusId != dto.LeadStatusId)
            {
                var history = new LeadStatusHistory
                {
                    LeadId = lead.Id,
                    OldStatusId = lead.LeadStatusId,
                    NewStatusId = dto.LeadStatusId,
                    ChangedById = lead.BrokerId,
                    Notes = "Stage updated from Edit Request Form",
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
            lead.UpdatedAt = DateTime.UtcNow;
            lead.LastActionBy = (dto.IsAdminAction == true) ? "admin" : "broker";

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

                // 🟢 حقول Get Recommendation - بتتحفظ زي ما هي جايه من صفحة Edit Request (Multi-select محول لـ Comma string)
                request.SelectedCities = dto.SelectedCities ?? request.SelectedCities;
                request.MinRooms = dto.MinRooms;
                request.MaxRooms = dto.MaxRooms;
                request.MinBathrooms = dto.MinBathrooms;
                request.MaxBathrooms = dto.MaxBathrooms;

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

            lead.UpdatedAt = DateTime.UtcNow;
            lead.LastActionBy = "broker"; // النوت دايماً من البروكر

            _context.Leads.Update(lead);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Note added successfully" });
        }

        // 1. نظام الترشيحات الذكي (Recommendation Engine)
        [HttpGet("{id}/recommendations")]
        public async Task<IActionResult> GetRecommendations(int id)
        {
            var request = await _context.LeadRequests.FirstOrDefaultAsync(r => r.LeadId == id);
            if (request == null) return Ok(new List<object>());

            decimal minBudget;
            decimal maxBudget;

            // 🟢 لو عنده ميزانية محددة (Budget Range جاي من مودال Get Recommendation مثلاً) بنستخدمها زي ما هي
            if (request.MinBudget > 0 || request.MaxBudget > 0)
            {
                minBudget = request.MinBudget;
                maxBudget = request.MaxBudget > 0 ? request.MaxBudget : decimal.MaxValue;
            }
            // 🟢 وإلا بنرجع للطريقة القديمة (Budget واحد ثابت + هامش حواليه)
            else if (request.TotalAmount.HasValue && request.TotalAmount.Value > 0)
            {
                decimal baseAmount = request.TotalAmount.Value;
                bool isVilla = !string.IsNullOrEmpty(request.PropertyType) && request.PropertyType.Replace(" ", "").Contains("Villa", StringComparison.OrdinalIgnoreCase);
                if (isVilla)
                {
                    minBudget = baseAmount - 5000000m;
                    maxBudget = baseAmount + 5000000m;
                }
                else
                {
                    minBudget = baseAmount - 200000m;
                    maxBudget = baseAmount + 600000m;
                }
                if (minBudget < 0) minBudget = 0;
            }
            else
            {
                // مفيش أي ميزانية خالص - نرجع ليستة فاضية زي الأول
                return Ok(new List<object>());
            }

            // بنجيب العقارات اللي البروكر اقترحها قبل كده
            var proposedIds = string.IsNullOrEmpty(request.ProposedPropertyIds)
                ? new List<string>()
                : request.ProposedPropertyIds.Split(',').ToList();

            var query = _context.Properties.Where(p => p.IsActive && p.IsApproved && !p.IsSold);

            // -- أ) فلتر الميزانية (Range)
            query = query.Where(p => p.Price >= minBudget && p.Price <= maxBudget);

            // -- ب) فلتر طريقة الدفع (تطابق تام)
            if (!string.IsNullOrEmpty(request.PaymentMethod))
            {
                query = query.Where(p => p.PaymentMethod == request.PaymentMethod);

                if (request.PaymentMethod == "Installment")
                {
                    if (request.DownPayment.HasValue && request.DownPayment.Value > 0)
                    {
                        decimal minDp = Math.Max(0, request.DownPayment.Value - 400000m);
                        decimal maxDp = request.DownPayment.Value + 400000m;
                        query = query.Where(p => p.PaymentPlans.Any(plan => plan.DownPayment >= minDp && plan.DownPayment <= maxDp));
                    }
                    if (request.QuarterlyInstallment.HasValue && request.QuarterlyInstallment.Value > 0)
                    {
                        decimal minQi = Math.Max(0, request.QuarterlyInstallment.Value - 70000m);
                        decimal maxQi = request.QuarterlyInstallment.Value + 70000m;
                        query = query.Where(p => p.PaymentPlans.Any(plan => plan.QuarterInstallment >= minQi && plan.QuarterInstallment <= maxQi));
                    }
                }
            }

            // -- ج) فلتر الغرض / نوع العرض (بقى Multi-select - Comma-separated - بنعمل OR بين كل القيم المختارة)
            if (!string.IsNullOrEmpty(request.Purpose))
            {
                var purposeEnums = new List<PropEnums.ListingType>();
                foreach (var p in request.Purpose.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    var clean = p.Replace(" ", "").Trim();
                    if (Enum.TryParse(typeof(PropEnums.ListingType), clean, true, out var parsed))
                        purposeEnums.Add((PropEnums.ListingType)parsed);
                }
                if (purposeEnums.Any())
                    query = query.Where(p => purposeEnums.Contains(p.ListingType));
            }

            // -- د) فلتر نوع العقار (بقى Multi-select - Comma-separated - بنعمل OR بين كل القيم المختارة)
            if (!string.IsNullOrEmpty(request.PropertyType))
            {
                var typeEnums = new List<PropEnums.PropertyType>();
                foreach (var t in request.PropertyType.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    var clean = t.Replace(" ", "").Trim();
                    if (Enum.TryParse(typeof(PropEnums.PropertyType), clean, true, out var parsed))
                        typeEnums.Add((PropEnums.PropertyType)parsed);
                }
                if (typeEnums.Any())
                    query = query.Where(p => typeEnums.Contains(p.PropertyType));
            }

            // -- هـ) فلتر المحافظة (الـ Zone القديم - بروكر بيحدده يدوي) أو المدن (Cities - جايه من مودال Get Recommendation)
            if (request.ZoneId.HasValue && request.ZoneId.Value > 0)
            {
                query = query.Where(p => (int)p.City == request.ZoneId.Value);
            }
            else if (!string.IsNullOrEmpty(request.SelectedCities))
            {
                var cityNameToId = new Dictionary<string, int> { { "Cairo", 1 }, { "Alexandria", 2 }, { "North Coast", 3 } };
                var cityIds = request.SelectedCities.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(c => cityNameToId.GetValueOrDefault(c.Trim(), 0))
                    .Where(id => id > 0).ToList();
                if (cityIds.Any())
                    query = query.Where(p => cityIds.Contains((int)p.City));
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

            // -- ز) فلتر الغرف والحمامات (لو متاحة - جايه من مودال Get Recommendation)
            if (request.MinRooms.HasValue) query = query.Where(p => p.Rooms >= request.MinRooms.Value);
            if (request.MaxRooms.HasValue) query = query.Where(p => p.Rooms <= request.MaxRooms.Value);
            if (request.MinBathrooms.HasValue) query = query.Where(p => p.Bathrooms >= request.MinBathrooms.Value);
            if (request.MaxBathrooms.HasValue) query = query.Where(p => p.Bathrooms <= request.MaxBathrooms.Value);

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

            // 🟢 نتأكد إن البروكر الجديد معداش الـ Lead Limit بتاعه قبل ما ننقله
            var newBroker = await _context.Users.FindAsync(dto.NewBrokerId) as ApplicantUser;
            if (newBroker?.LeadLimit != null)
            {
                var currentCount = await _context.Leads.CountAsync(l => l.BrokerId == dto.NewBrokerId && !l.IsUnassigned);
                if (currentCount >= newBroker.LeadLimit)
                {
                    return BadRequest($"This broker has reached their lead limit ({newBroker.LeadLimit}). Please increase the limit or choose another broker.");
                }
            }

            lead.BrokerId = dto.NewBrokerId;
            lead.UpdatedAt = DateTime.UtcNow;
            lead.LastActionBy = "admin";
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

        // GET: api/crm/leads/pending-clients
        // 🟢 العملاء اللي اتسحبوا تلقائيًا من البروكر بتاعهم (IsUnassigned = true) وعايزين بروكر جديد
        [HttpGet("pending-clients")]
        public async Task<IActionResult> GetPendingClients()
        {
            var pendingLeads = await _context.Leads
                .Include(l => l.Broker)
                .Include(l => l.Status)
                .Where(l => l.IsUnassigned)
                .OrderBy(l => l.UnassignedAt)
                .Select(l => new
                {
                    l.Id,
                    l.FullName,
                    l.PhoneNumber,
                    StatusName = l.Status.Name,
                    StatusId = l.LeadStatusId,
                    PreviousBrokerId = l.PreviousBrokerId,
                    // 👇 اسم البروكر اللي اتسحب منه العميل (البروكر القديم)
                    PreviousBrokerName = l.Broker != null ? l.Broker.FirstName + " " + l.Broker.LastName : "Unknown",
                    UnassignedAt = l.UnassignedAt,
                    HoursSinceUnassigned = l.UnassignedAt.HasValue ? (int)(DateTime.UtcNow - l.UnassignedAt.Value).TotalHours : 0
                })
                .ToListAsync();

            return Ok(pendingLeads);
        }

        // PUT: api/crm/leads/{id}/assign-new-broker
        // 🟢 الأدمن بيدي العميل المسحوب لبروكر جديد من تاب Pending Clients
        // بيصفر كل العدادات (الفيدباك) بس بيسيب الفيدباكات القديمة موجودة في السجل كتاريخ
        [HttpPut("{id}/assign-new-broker")]
        public async Task<IActionResult> AssignNewBroker(int id, [FromBody] AssignNewBrokerDto dto)
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null) return NotFound("Lead not found");
            if (!lead.IsUnassigned) return BadRequest("This lead is not in the pending pool.");

            // 🟢 نتأكد إن البروكر الجديد معداش الـ Lead Limit بتاعه قبل ما نديله العميل
            var newBrokerUser = await _context.Users.FindAsync(dto.NewBrokerId) as ApplicantUser;
            if (newBrokerUser?.LeadLimit != null)
            {
                var currentCount = await _context.Leads.CountAsync(l => l.BrokerId == dto.NewBrokerId && !l.IsUnassigned);
                if (currentCount >= newBrokerUser.LeadLimit)
                {
                    return BadRequest($"This broker has reached their lead limit ({newBrokerUser.LeadLimit}). Please increase the limit or choose another broker.");
                }
            }

            // 🟢 نسجل مين كان البروكر القديم عشان يفضل شايف العميل كـ Disappeared عنده
            lead.PreviousBrokerId = lead.BrokerId;

            // 🟢 تعيين البروكر الجديد
            lead.BrokerId = dto.NewBrokerId;
            lead.IsUnassigned = false;
            lead.LastActionBy = "admin";
            lead.UpdatedAt = DateTime.UtcNow;

            // 🟢 تصفير عداد الفيدباك - الفيدباكات القديمة بتفضل في GeneralFeedback كتاريخ
            // بس مش هتتحسب في العداد بعد التاريخ ده
            lead.FeedbackCounterResetAt = DateTime.UtcNow;

            // تسجيل حركة التعيين الجديد في الـ History
            _context.LeadStatusHistories.Add(new LeadStatusHistory
            {
                LeadId = lead.Id,
                OldStatusId = lead.LeadStatusId,
                NewStatusId = lead.LeadStatusId,
                ChangedById = dto.AdminId,
                Notes = "Admin assigned this lead to a new broker after it was auto-unassigned (no action for 72 hours).",
                ChangedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Lead assigned to new broker successfully! All counters have been reset." });
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
                lead.UpdatedAt = DateTime.UtcNow;
                lead.LastActionBy = "admin";

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