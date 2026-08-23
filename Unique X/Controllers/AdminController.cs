using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Unique_X.Data;
using Unique_X.DTOs;
using Unique_X.Models;
using Unique_X.Services.Implementation;
using Unique_X.Services.Interface;
using static Unique_X.Models.PropEnums;

namespace Unique_X.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<ApplicantUser> _userManager;
        private readonly AppDbContext _context;
        private readonly IPhotoService _photoService;

        public AdminController(UserManager<ApplicantUser> userManager, AppDbContext context, IPhotoService photoService)
        {
            _userManager = userManager;
            _context = context;
            _photoService = photoService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            // الآن ToListAsync ستعمل بدون أخطاء
            var users = await _userManager.Users.Select(u => new {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.UserType,
                u.IsActive,
                u.PhoneNumber,
                u.HasCrmAccess,
                u.CreatedAt
            }).ToListAsync();
            return Ok(users);
        }

        [HttpPatch("toggle-user/{id}")]
        public async Task<IActionResult> ToggleUserStatus(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();
            user.IsActive = !user.IsActive;
            await _userManager.UpdateAsync(user);
            return Ok(new { Status = user.IsActive });
        }
        [HttpPatch("reassign-property/{propertyId}/{newBrokerId}")]
        public async Task<IActionResult> ReassignProperty(int propertyId, string newBrokerId)
        {
            var property = await _context.Properties.FindAsync(propertyId);
            if (property == null) return NotFound("Property not found");

            var newBroker = await _userManager.FindByIdAsync(newBrokerId);
            if (newBroker == null || newBroker.UserType != 1)
                return BadRequest("Invalid broker account");

            property.BrokerId = newBrokerId;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Property reassigned successfully" });
        }

        // 🟢 لكل بروكر: عدد الوحدات اللي رفعها بنفسه، عدد الوحدات اللي اتنقلتله من بروكرز تانيين،
        // إجمالي الوحدات المسؤول عنها دلوقتي، والـ Limit بتاعه (لو محدد)
        [HttpGet("broker-stats")]
        public async Task<IActionResult> GetBrokerStats()
        {
            var brokers = await _userManager.Users
                .Where(u => u.UserType == 1) // Broker
                .ToListAsync();

            var properties = await _context.Properties
                .Select(p => new { p.BrokerId, p.AddedByBrokerId, p.IsSold })
                .ToListAsync();

            var result = brokers.Select(b =>
            {
                var addedCount = properties.Count(p => p.AddedByBrokerId == b.Id);
                var currentCount = properties.Count(p => p.BrokerId == b.Id);
                var transferredCount = properties.Count(p => p.BrokerId == b.Id && p.AddedByBrokerId != b.Id);
                var activeCount = properties.Count(p => p.BrokerId == b.Id && !p.IsSold);

                return new
                {
                    BrokerId = b.Id,
                    BrokerName = $"{b.FirstName} {b.LastName}".Trim(),
                    BrokerCode = b.BrokerCode,
                    AddedCount = addedCount,
                    TransferredCount = transferredCount,
                    CurrentTotal = currentCount,
                    ActiveCount = activeCount, // ده اللي بيتحسب على الـ Limit (بيستثني المباع)
                    PropertyLimit = b.PropertyLimit
                };
            })
            .OrderByDescending(x => x.CurrentTotal)
            .ToList();

            return Ok(result);
        }

        // 🟢 تحديد/تعديل/إلغاء الـ Limit بتاع بروكر معين (null = من غير حد أقصى)
        [HttpPatch("set-broker-limit/{brokerId}")]
        public async Task<IActionResult> SetBrokerLimit(string brokerId, [FromBody] SetBrokerLimitDto dto)
        {
            var broker = await _userManager.FindByIdAsync(brokerId);
            if (broker == null) return NotFound("Broker not found");

            broker.PropertyLimit = dto.Limit;
            await _userManager.UpdateAsync(broker);

            return Ok(new { Message = "Limit updated successfully" });
        }

        // ===================== Job Postings (صفحة Join Our Team) =====================

        // 🟢 عام - الوظائف المتاحة بس (اللي بتظهر لأي حد بيفتح صفحة Join Our Team)
        [HttpGet("job-postings")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveJobPostings()
        {
            var jobs = await _context.JobPostings
                .Where(j => j.IsActive)
                .OrderByDescending(j => j.CreatedAt)
                .ToListAsync();
            return Ok(jobs);
        }

        // 🟢 عام - تفاصيل وظيفة واحدة
        [HttpGet("job-postings/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetJobPostingById(int id)
        {
            var job = await _context.JobPostings.FindAsync(id);
            return job != null ? Ok(job) : NotFound();
        }

        // 🟢 أدمن - كل الوظائف (شاملة الموقوفة) عشان تاب الإدارة
        [HttpGet("job-postings/all")]
        public async Task<IActionResult> GetAllJobPostings()
        {
            var jobs = await _context.JobPostings.OrderByDescending(j => j.CreatedAt).ToListAsync();
            return Ok(jobs);
        }

        // 🟢 أدمن - إضافة وظيفة جديدة
        [HttpPost("job-postings")]
        public async Task<IActionResult> AddJobPosting([FromBody] JobPostingDto dto)
        {
            var job = new JobPosting
            {
                JobTitle = dto.JobTitle ?? string.Empty,
                JobSummary = dto.JobSummary ?? string.Empty,
                KeyResponsibilities = dto.KeyResponsibilities ?? string.Empty,
                Qualifications = dto.Qualifications ?? string.Empty,
                KPIs = dto.KPIs ?? string.Empty,
                IsActive = true
            };

            _context.JobPostings.Add(job);
            await _context.SaveChangesAsync();
            return Ok(job);
        }

        // 🟢 أدمن - تعديل وظيفة موجودة
        [HttpPut("job-postings/{id}")]
        public async Task<IActionResult> UpdateJobPosting(int id, [FromBody] JobPostingDto dto)
        {
            var job = await _context.JobPostings.FindAsync(id);
            if (job == null) return NotFound("Job posting not found");

            job.JobTitle = dto.JobTitle ?? job.JobTitle;
            job.JobSummary = dto.JobSummary ?? job.JobSummary;
            job.KeyResponsibilities = dto.KeyResponsibilities ?? job.KeyResponsibilities;
            job.Qualifications = dto.Qualifications ?? job.Qualifications;
            job.KPIs = dto.KPIs ?? job.KPIs;

            await _context.SaveChangesAsync();
            return Ok(job);
        }

        // 🟢 أدمن - إظهار/إخفاء الوظيفة من غير ما تتمسح
        [HttpPatch("job-postings/{id}/toggle")]
        public async Task<IActionResult> ToggleJobPosting(int id)
        {
            var job = await _context.JobPostings.FindAsync(id);
            if (job == null) return NotFound("Job posting not found");

            job.IsActive = !job.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { job.IsActive });
        }

        // 🟢 أدمن - مسح الوظيفة نهائيًا
        [HttpDelete("job-postings/{id}")]
        public async Task<IActionResult> DeleteJobPosting(int id)
        {
            var job = await _context.JobPostings.FindAsync(id);
            if (job == null) return NotFound("Job posting not found");

            _context.JobPostings.Remove(job);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Job posting deleted" });
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var stats = new
            {
                TotalUsers = await _userManager.Users.CountAsync(),
                TotalProperties = await _context.Properties.CountAsync(),
                SuspendedUsers = await _userManager.Users.CountAsync(u => !u.IsActive),
                SoldProperties = await _context.Properties.CountAsync(p => p.IsSold),
                InactiveProperties = await _context.Properties.CountAsync(p => !p.IsActive),
                TotalWhatsAppClicks = await _context.AnalyticsRecords.CountAsync(r => r.ActionType == "WhatsAppClick"),
                TotalCallClicks = await _context.AnalyticsRecords.CountAsync(r => r.ActionType == "CallClick")
            };
            return Ok(stats);

        }

        //[HttpGet("properties")]
        [HttpGet("properties-detailed")]
        public async Task<IActionResult> GetAllPropertiesDetailed()
        {
            var props = await _context.Properties
                .Include(p => p.Broker)
                .Include(p => p.Photos)
                .Include(p => p.PaymentPlans)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return Ok(props);
        }

        [HttpPatch("toggle-property/{id}")]
        public async Task<IActionResult> TogglePropertyStatus(int id)
        {
            var prop = await _context.Properties.FindAsync(id);
            if (prop == null) return NotFound();
            prop.IsActive = !prop.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { Status = prop.IsActive });
        }

        // تفعيل/إلغاء وحدة كـ Hot Deal (الأدمن بيختارها من ليستة الأكواد عنده)
        [HttpPatch("toggle-hot-deal/{id}")]
        public async Task<IActionResult> ToggleHotDeal(int id)
        {
            var prop = await _context.Properties.FindAsync(id);
            if (prop == null) return NotFound();
            prop.IsHotDeal = !prop.IsHotDeal;
            await _context.SaveChangesAsync();
            return Ok(new { Status = prop.IsHotDeal });
        }

        [HttpPost("add-banner")]
        public async Task<IActionResult> AddBanner([FromForm] BannerUploadDto dto)
        {
            var result = await _photoService.AddPhotoAsync(dto.File);
            if (result.Error != null) return BadRequest(result.Error.Message);

            var banner = new HomeBanner
            {
                ImageUrl = result.SecureUrl.AbsoluteUri,
                PublicId = result.PublicId,
                MessageTitle = dto.Title
            };

            _context.HomeBanners.Add(banner);
            await _context.SaveChangesAsync();
            return Ok(banner);
        }


        [HttpPost("duplicate-property/{id}/{newBrokerId}")]
        public async Task<IActionResult> DuplicateProperty(int id, string newBrokerId)
        {
            // 1. التأكد من البروكر
            var newBroker = await _userManager.FindByIdAsync(newBrokerId);
            if (newBroker == null || newBroker.UserType != 1)
                return BadRequest("Invalid broker account.");

            // 2. جلب العقار الأصلي مع فصله عن التتبع (AsNoTracking) عشان نقدر ننسخه كعنصر جديد
            var originalProp = await _context.Properties
                .Include(p => p.Photos)
                .Include(p => p.PaymentPlans)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);

            if (originalProp == null) return NotFound("Property not found.");

            // 3. تصفير الـ IDs وتعديل البيانات الأساسية للنسخة الجديدة
            originalProp.Id = 0;
            originalProp.BrokerId = newBrokerId;
            originalProp.CreatedAt = DateTime.UtcNow;
            originalProp.Code = originalProp.Code + "-COPY";

            // تفعيل النسخة الجديدة لتظهر في الهوم فوراً
            originalProp.IsApproved = true;
            originalProp.IsActive = true;

            // 4. نسخ الصور (مع حماية الـ PublicId عشان منمسحش الصورة الأصلية من Cloudinary بالخطأ)
            if (originalProp.Photos != null)
            {
                foreach (var photo in originalProp.Photos)
                {
                    photo.Id = 0;
                    photo.PropertyId = 0;
                    photo.PublicId = "COPY_" + photo.PublicId;
                }
            }

            // 5. نسخ خطط الدفع
            if (originalProp.PaymentPlans != null)
            {
                foreach (var plan in originalProp.PaymentPlans)
                {
                    plan.Id = 0;
                    plan.PropertyId = 0;
                }
            }
            _context.Properties.Add(originalProp);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Property duplicated successfully!" });
        }

        [HttpDelete("delete-banner/{id}")]
        public async Task<IActionResult> DeleteBanner(int id)
        {
            var banner = await _context.HomeBanners.FindAsync(id);
            if (banner == null) return NotFound();

            await _photoService.DeletePhotoAsync(banner.PublicId);
            _context.HomeBanners.Remove(banner);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Deleted" });
        }

        [HttpGet("banners")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBanners()
        {
            var banners = await _context.HomeBanners
                .OrderBy(b => b.DisplayOrder)
                .ToListAsync();
            return Ok(banners ?? new List<HomeBanner>());
        }

        [HttpPut("banners/reorder")]
        public async Task<IActionResult> ReorderBanners([FromBody] List<int> orderedIds)
        {
            for (int i = 0; i < orderedIds.Count; i++)
            {
                var banner = await _context.HomeBanners.FindAsync(orderedIds[i]);
                if (banner != null)
                    banner.DisplayOrder = i;
            }
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("track")]
        [AllowAnonymous]
        public async Task<IActionResult> TrackAction(string action, int? propertyId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var record = new AnalyticsRecord
            {
                ActionType = action,
                PropertyId = propertyId,
                UserId = userId
            };

            _context.AnalyticsRecords.Add(record);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("properties-sold")]
        public async Task<IActionResult> GetSoldProperties()
        {
            var props = await _context.Properties
                .Include(p => p.Broker)
                .Where(p => p.IsSold)
                .Select(p => new {
                    p.Id,
                    p.Title,
                    p.Code,
                    p.PropertyType,
                    BrokerName = p.Broker.FirstName + " " + p.Broker.LastName
                }).ToListAsync();
            return Ok(props);
        }

        [HttpGet("activity-logs/{type}")]
        public async Task<IActionResult> GetActivityLogs(string type)
        {
            var logs = await _context.AnalyticsRecords
                .Where(r => r.ActionType == type)
                .OrderByDescending(r => r.Timestamp)
                .Select(r => new {
                    r.Timestamp,
                    UserWhoClicked = _context.Users.Where(u => u.Id == r.UserId)
                                     .Select(u => u.FirstName + " " + u.LastName + " (" + u.PhoneNumber + ")")
                                     .FirstOrDefault() ?? "Guest User",
                    Property = _context.Properties.Where(p => p.Id == r.PropertyId)
                               .Select(p => new {
                                   p.Title,
                                   p.Code,
                                   p.PropertyType,
                                   BrokerFullName = p.Broker.FirstName + " " + p.Broker.LastName
                               }).FirstOrDefault()
                }).ToListAsync();

            return Ok(logs);
        }

        [HttpGet("suspended-users")]
        public async Task<IActionResult> GetSuspendedUsers()
        {
            var users = await _userManager.Users
                .Where(u => !u.IsActive)
                .Select(u => new {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.UserType,
                    u.IsActive,
                    u.PhoneNumber,
                    u.ProfileImageUrl
                }).ToListAsync();
            return Ok(users);
        }

        [HttpGet("suspended-properties")]
        public async Task<IActionResult> GetSuspendedProperties()
        {
            var props = await _context.Properties
                .Include(p => p.Broker)
                .Include(p => p.PaymentPlans)
                .Where(p => !p.IsActive)
                .Select(p => new {
                    p.Id,
                    p.Title,
                    p.Code,
                    p.Price,
                    p.IsActive,
                    p.IsSold,
                    BrokerName = p.Broker.FirstName + " " + p.Broker.LastName,
                    Photos = p.Photos.Select(img => new { img.Url }).ToList()
                }).ToListAsync();
            return Ok(props);
        }

        [HttpGet("financial-file")]
        public async Task<IActionResult> GetFinancialFile()
        {
            // بنجيب بيانات أحدث ملف مرفوع (بدون جلب محتوى الملف نفسه لتسريع التحميل)
            var file = await _context.FinancialFiles
                .OrderByDescending(f => f.UploadedAt)
                .Select(f => new {
                    f.Id,
                    f.FileName,
                    f.UploadedAt
                }).FirstOrDefaultAsync();

            if (file == null) return NotFound("No financial file found.");
            return Ok(file);
        }

        [HttpPost("upload-financial")]
        public async Task<IActionResult> UploadFinancialFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var ext = Path.GetExtension(file.FileName).ToLower();
            if (ext != ".xlsx" && ext != ".csv" && ext != ".xls")
                return BadRequest("Only Excel (.xlsx, .xls) and CSV files are allowed.");

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);

            var oldFiles = await _context.FinancialFiles.ToListAsync();
            if (oldFiles.Any())
            {
                _context.FinancialFiles.RemoveRange(oldFiles);
            }

            var newFile = new FinancialFile
            {
                FileName = file.FileName,
                ContentType = file.ContentType,
                FileData = memoryStream.ToArray(),
                UploadedAt = DateTime.UtcNow
            };

            _context.FinancialFiles.Add(newFile);
            await _context.SaveChangesAsync();

            return Ok(new { newFile.Id, newFile.FileName, newFile.UploadedAt });
        }

        [HttpDelete("delete-financial/{id}")]
        public async Task<IActionResult> DeleteFinancialFile(int id)
        {
            var file = await _context.FinancialFiles.FindAsync(id);
            if (file == null) return NotFound();

            _context.FinancialFiles.Remove(file);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "File deleted successfully" });
        }

        // ===================== Project Financial Charts (نفس فكرة Financial بالظبط) =====================
        // ملف واحد شامل فيه: اسم المشروع + السنة + سعر المتر Resale + سعر المتر Primary

        [HttpGet("project-financial-file")]
        public async Task<IActionResult> GetProjectFinancialFile()
        {
            var file = await _context.ProjectFinancialFiles
                .OrderByDescending(f => f.UploadedAt)
                .Select(f => new {
                    f.Id,
                    f.FileName,
                    f.UploadedAt
                }).FirstOrDefaultAsync();

            if (file == null) return NotFound("No project financial file found.");
            return Ok(file);
        }

        [HttpPost("upload-project-financial")]
        public async Task<IActionResult> UploadProjectFinancialFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var ext = Path.GetExtension(file.FileName).ToLower();
            if (ext != ".xlsx" && ext != ".csv" && ext != ".xls")
                return BadRequest("Only Excel (.xlsx, .xls) and CSV files are allowed.");

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);

            var oldFiles = await _context.ProjectFinancialFiles.ToListAsync();
            if (oldFiles.Any())
            {
                _context.ProjectFinancialFiles.RemoveRange(oldFiles);
            }

            var newFile = new ProjectFinancialFile
            {
                FileName = file.FileName,
                ContentType = file.ContentType,
                FileData = memoryStream.ToArray(),
                UploadedAt = DateTime.UtcNow
            };

            _context.ProjectFinancialFiles.Add(newFile);
            await _context.SaveChangesAsync();

            return Ok(new { newFile.Id, newFile.FileName, newFile.UploadedAt });
        }

        [HttpDelete("delete-project-financial/{id}")]
        public async Task<IActionResult> DeleteProjectFinancialFile(int id)
        {
            var file = await _context.ProjectFinancialFiles.FindAsync(id);
            if (file == null) return NotFound();

            _context.ProjectFinancialFiles.Remove(file);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "File deleted successfully" });
        }


        [HttpGet("pending-properties")]
        public async Task<IActionResult> GetPendingProperties()
        {
            var props = await _context.Properties
                .Include(p => p.Broker)
                .Include(p => p.Photos)
                .Include(p => p.PaymentPlans)
                .Where(p => !p.IsApproved && p.RejectionReason == null && !p.IsOwnerSubmitted)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Id,
                    p.Title,
                    p.Code,
                    p.Price,
                    p.ListingType,
                    p.PropertyType,
                    p.Region,
                    City = p.City.ToString(),
                    p.CreatedAt,
                    PricePerMeter = p.Area > 0 ? Math.Round(p.Price / (decimal)p.Area) : 0,
                    p.IsApproved,
                    p.RejectionReason,
                    p.IsActive,
                    p.IsSold,
                    p.IsOwnerSubmitted,
                    p.Area,
                    p.Rooms,
                    p.Bathrooms,
                    p.Floor,
                    p.TotalFloors,
                    p.ApartmentsPerFloor,
                    p.ElevatorsCount,
                    p.Finishing,
                    p.BuildYear,
                    p.View,
                    p.DeliveryStatus,
                    p.DeliveryYear,
                    p.PaymentMethod,
                    p.MonthlyRent,
                    p.SecurityDeposit,
                    p.ProjectName,
                    p.DistanceFromLandmark,
                    p.Description,
                    p.IsLicensed,
                    p.HasLandShare,
                    p.IsLegalReconciled,
                    p.IsFirstOwner,
                    p.HasSecurity,
                    p.HasParking,
                    p.HasPool,
                    p.HasGarden,
                    p.HasElectricityMeter,
                    p.HasWaterMeter,
                    p.HasGasMeter,
                    // Villa fields
                    p.AreaType,
                    p.VillaCategory,
                    p.VillaSubType,
                    p.GroundRooms,
                    p.GroundBaths,
                    p.FirstRooms,
                    p.FirstBaths,
                    p.SecondRooms,
                    p.OwnerName,
                    p.OwnerPhone,
                    p.DeveloperName,
                    p.SecondBaths,
                    // Broker info
                    BrokerName = p.Broker.FirstName + " " + p.Broker.LastName,
                    BrokerPhone = p.Broker.PhoneNumber,
                    BrokerId = p.Broker.Id,
                    // Related data
                    Photos = p.Photos.Select(ph => new { ph.Url, ph.IsMain }),
                    PaymentPlans = p.PaymentPlans.Select(pl => new
                    {
                        pl.DownPayment,
                        pl.QuarterInstallment,
                        pl.InstallmentYears
                    })
                })
                .ToListAsync();

            return Ok(props);
        }

        [HttpPatch("approve-property/{id}")]
        public async Task<IActionResult> ApproveProperty(int id)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null) return NotFound("Property not found");

            property.IsApproved = true;
            property.IsActive = true;
            property.RejectionReason = null;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Property approved and published successfully" });
        }

        [HttpPatch("leads/{leadId}/approve-duplicate")]
        public async Task<IActionResult> ApproveDuplicate(int leadId)
        {
            var lead = await _context.Leads.FindAsync(leadId);
            if (lead == null) return NotFound();

            lead.IsApprovedDuplicate = true;
            lead.IsRejectedDuplicate = false;
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Duplicate lead approved" });
        }

        [HttpPatch("leads/{leadId}/reject-duplicate")]
        public async Task<IActionResult> RejectDuplicate(int leadId)
        {
            var lead = await _context.Leads.FindAsync(leadId);
            if (lead == null) return NotFound();

            lead.IsApprovedDuplicate = false;
            lead.IsRejectedDuplicate = true; // تأكدي أن هذا الحقل موجود في الـ Lead Model

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Duplicate lead rejected" });
        }


        [HttpPatch("reject-property/{id}")]
        public async Task<IActionResult> RejectProperty(int id, [FromBody] RejectDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Reason))
                return BadRequest("Rejection reason is required");

            var property = await _context.Properties.FindAsync(id);
            if (property == null) return NotFound("Property not found");

            property.IsApproved = false;
            property.IsActive = false;
            property.RejectionReason = dto.Reason;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Property rejected" });
        }

        [HttpGet("hot-deals")]
        public async Task<IActionResult> GetAllHotDeals()
        {
            var deals = await _context.HotDeals
                .Include(h => h.Property)
                .ThenInclude(p => p.Photos)
                .OrderByDescending(h => h.AddedAt)
                .ToListAsync();
            return Ok(deals);
        }

        [HttpPost("hot-deals")]
        public async Task<IActionResult> AddHotDeal([FromBody] HotDealDto dto)
        {
            var count = await _context.HotDeals.CountAsync();
            if (count >= 12) return BadRequest("Maximum 12 Hot Deals allowed.");

            var property = await _context.Properties.FirstOrDefaultAsync(p => p.Code == dto.Code);
            if (property == null) return NotFound("Property not found with this code.");

            if (await _context.HotDeals.AnyAsync(h => h.PropertyId == property.Id))
                return BadRequest("Property already exists in Hot Deals.");

            _context.HotDeals.Add(new HotDeal { PropertyId = property.Id });
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Added successfully" });
        }

        [HttpDelete("hot-deals/{id}")]
        public async Task<IActionResult> RemoveHotDeal(int id)
        {
            var deal = await _context.HotDeals.FindAsync(id);
            if (deal == null) return NotFound();

            _context.HotDeals.Remove(deal);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Removed successfully" });
        }

        // ===================== Recommended to Visit =====================
        // نفس فكرة Hot Deals بالظبط - قائمة تانية منفصلة تظهر في الهوم تحت Hot Deals

        [HttpGet("recommended-visits")]
        public async Task<IActionResult> GetAllRecommendedVisits()
        {
            var visits = await _context.RecommendedVisits
                .Include(h => h.Property)
                .ThenInclude(p => p.Photos)
                .OrderByDescending(h => h.AddedAt)
                .ToListAsync();
            return Ok(visits);
        }

        [HttpPost("recommended-visits")]
        public async Task<IActionResult> AddRecommendedVisit([FromBody] RecommendedVisitDto dto)
        {
            var count = await _context.RecommendedVisits.CountAsync();
            if (count >= 12) return BadRequest("Maximum 12 Recommended to Visit properties allowed.");

            var property = await _context.Properties.FirstOrDefaultAsync(p => p.Code == dto.Code);
            if (property == null) return NotFound("Property not found with this code.");

            if (await _context.RecommendedVisits.AnyAsync(h => h.PropertyId == property.Id))
                return BadRequest("Property already exists in Recommended to Visit.");

            _context.RecommendedVisits.Add(new RecommendedVisit { PropertyId = property.Id });
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Added successfully" });
        }

        [HttpDelete("recommended-visits/{id}")]
        public async Task<IActionResult> RemoveRecommendedVisit(int id)
        {
            var visit = await _context.RecommendedVisits.FindAsync(id);
            if (visit == null) return NotFound();

            _context.RecommendedVisits.Remove(visit);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Removed successfully" });
        }

        [HttpPatch("grant-crm/{id}")]
        public async Task<IActionResult> GrantCrmAccess(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();
            user.HasCrmAccess = true;
            await _userManager.UpdateAsync(user);
            return Ok(new { Message = "CRM Access Granted" });
        }

        [HttpPatch("revoke-crm/{id}")]
        public async Task<IActionResult> RevokeCrmAccess(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();
            user.HasCrmAccess = false;
            await _userManager.UpdateAsync(user);
            return Ok(new { Message = "CRM Access Revoked" });
        }

        [HttpGet("pending-deletions")]
        public async Task<IActionResult> GetPendingDeletions()
        {
            var props = await _context.Properties
                .Include(p => p.Broker)
                .Include(p => p.Photos)
                .Where(p => p.PendingDeletion)
                .OrderByDescending(p => p.DeletionRequestedAt)
                .Select(p => new {
                    p.Id,
                    p.Title,
                    p.Code,
                    p.Price,
                    p.City,
                    p.ListingType,
                    p.PropertyType,
                    p.DeletionRequestedAt,
                    BrokerName = p.Broker.FirstName + " " + p.Broker.LastName,
                    BrokerPhone = p.Broker.PhoneNumber,
                    MainPhoto = p.Photos.Where(ph => ph.IsMain).Select(ph => ph.Url).FirstOrDefault()
                             ?? p.Photos.Select(ph => ph.Url).FirstOrDefault()
                })
                .ToListAsync();

            return Ok(props);
        }

        [HttpPost("approve-deletion/{id}")]
        public async Task<IActionResult> ApproveDeletion(int id)
        {
            var property = await _context.Properties
                .Include(p => p.Photos)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (property == null) return NotFound();

            // حذف الصور من Cloudinary
            if (property.Photos != null)
            {
                foreach (var photo in property.Photos)
                {
                    if (!string.IsNullOrEmpty(photo.PublicId) && !photo.PublicId.StartsWith("COPY_"))
                        await _photoService.DeletePhotoAsync(photo.PublicId);
                }
            }

            _context.Properties.Remove(property);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Property permanently deleted." });
        }

        [HttpPost("reject-deletion/{id}")]
        public async Task<IActionResult> RejectDeletion(int id, [FromBody] RejectDeletionDto dto)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null) return NotFound();

            property.PendingDeletion = false;
            property.IsActive = true; // نرجعها تظهر
            property.DeletionRejectionReason = dto.Reason;

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Deletion rejected. Property restored." });
        }

        [HttpGet("approved-property-codes")]
        public async Task<IActionResult> GetApprovedPropertyCodes()
        {
            var codes = await _context.Properties
                .Where(p => p.IsApproved == true && p.Code != null)
                .Select(p => p.Code)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return Ok(codes);
        }

        // GET: api/admin/brokers-with-codes
        // بيرجع كل البروكرز مع الـ Code بتاعهم
        // 🟢 [AllowAnonymous] هنا عشان أي بروكر (مش أدمن بس) يقدر يجيب اللستة دي من صفحة Add Lead / Edit Request
        // من غير ما نفتح باقي endpoints الأدمن (اللي لسه محمية بـ [Authorize(Roles = "Admin")] على مستوى الكلاس)
        [HttpGet("brokers-with-codes")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBrokersWithCodes()
        {
            var brokers = await _userManager.Users
                .Where(u => u.UserType == 1 && u.IsActive)
                .OrderBy(u => u.FirstName)
                .Select(u => new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.PhoneNumber,
                    u.BrokerCode
                })
                .ToListAsync();

            return Ok(brokers);
        }

        // PUT: api/admin/set-broker-code/{id}
        // بيحدد أو يعدل الـ Code بتاع بروكر معين
        [HttpPut("set-broker-code/{id}")]
        public async Task<IActionResult> SetBrokerCode(string id, [FromBody] string code)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null || user.UserType != 1)
                return NotFound("Broker not found.");

            // تأكد إن الكود مش متكرر
            var codeExists = await _userManager.Users
                .AnyAsync(u => u.BrokerCode == code && u.Id != id);
            if (codeExists)
                return BadRequest($"Code '{code}' is already used by another broker.");

            user.BrokerCode = code;
            await _userManager.UpdateAsync(user);
            return Ok(new { message = "Broker code updated successfully.", code });
        }

        // DELETE: api/admin/clear-broker-code/{id}
        // بيمسح الـ Code بتاع بروكر
        [HttpDelete("clear-broker-code/{id}")]
        public async Task<IActionResult> ClearBrokerCode(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();
            user.BrokerCode = null;
            await _userManager.UpdateAsync(user);
            return Ok(new { message = "Broker code cleared." });
        }

        // ===================== Projects Meetings (تاب "Projects Meetings" بالأدمن) =====================

        // GET: api/admin/project-meetings
        [HttpGet("project-meetings")]
        public async Task<IActionResult> GetProjectMeetings()
        {
            var meetings = await _context.ProjectMeetingRequests
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => new ProjectMeetingResponseDto
                {
                    Id = m.Id,
                    BlogId = m.BlogId,
                    ProjectName = m.ProjectName,
                    FullName = m.FullName,
                    Phone = m.Phone,
                    MeetingDate = m.MeetingDate,
                    Notes = m.Notes,
                    IsContacted = m.IsContacted,
                    CreatedAt = m.CreatedAt
                })
                .ToListAsync();

            return Ok(meetings);
        }

        // PATCH: api/admin/project-meetings/{id}/toggle-contacted
        [HttpPatch("project-meetings/{id}/toggle-contacted")]
        public async Task<IActionResult> ToggleProjectMeetingContacted(int id)
        {
            var meeting = await _context.ProjectMeetingRequests.FindAsync(id);
            if (meeting == null) return NotFound("Meeting request not found");

            meeting.IsContacted = !meeting.IsContacted;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Updated successfully!", isContacted = meeting.IsContacted });
        }

        [HttpGet("home-section-banners")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHomeSectionBanners()
        {
            // 🟢 دلوقتي بترجع Array مرتب حسب DisplayOrder بدل object بخصائص ثابتة،
            // عشان يدعم أي عدد بانرات وترتيب قابل للتغيير من الأدمن (Drag & Drop)
            var banners = await _context.HomeSectionBanners
                .OrderBy(b => b.DisplayOrder)
                .Select(b => new { b.Key, b.ImageUrl, b.DisplayOrder })
                .ToListAsync();

            return Ok(banners);
        }

        [HttpPost("home-section-banners")]
        public async Task<IActionResult> UploadHomeSectionBanner([FromForm] HomeSectionBannerUploadDto dto)
        {
            var validKeys = new[] { "explore-home", "add-property", "add-property-2", "compare", "price-range", "recommendation" };
            if (!validKeys.Contains(dto.Key))
                return BadRequest("Invalid banner key.");

            // لو فيه بانر قديم بنفس المكان، بنمسحه الأول (صورة واحدة بس مسموح بيها) - بنحافظ على مكانه في الترتيب
            var existing = await _context.HomeSectionBanners.FirstOrDefaultAsync(b => b.Key == dto.Key);
            int displayOrder;
            if (existing != null)
            {
                displayOrder = existing.DisplayOrder;
                await _photoService.DeletePhotoAsync(existing.PublicId);
                _context.HomeSectionBanners.Remove(existing);
            }
            else
            {
                // بانر جديد بيتحط في آخر الترتيب
                displayOrder = await _context.HomeSectionBanners.AnyAsync()
                    ? await _context.HomeSectionBanners.MaxAsync(b => b.DisplayOrder) + 1
                    : 0;
            }

            var result = await _photoService.AddPhotoAsync(dto.File);
            if (result.Error != null) return BadRequest(result.Error.Message);

            var banner = new HomeSectionBanner
            {
                Key = dto.Key,
                ImageUrl = result.SecureUrl.AbsoluteUri,
                PublicId = result.PublicId,
                DisplayOrder = displayOrder
            };

            _context.HomeSectionBanners.Add(banner);
            await _context.SaveChangesAsync();
            return Ok(banner);
        }

        [HttpDelete("home-section-banners/{key}")]
        public async Task<IActionResult> DeleteHomeSectionBanner(string key)
        {
            var banner = await _context.HomeSectionBanners.FirstOrDefaultAsync(b => b.Key == key);
            if (banner == null) return NotFound();

            await _photoService.DeletePhotoAsync(banner.PublicId);
            _context.HomeSectionBanners.Remove(banner);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Deleted" });
        }

        // 🟢 حفظ ترتيب البانرات بعد الـ drag & drop في صفحة Load Banners
        [HttpPut("home-section-banners/reorder")]
        public async Task<IActionResult> ReorderHomeSectionBanners([FromBody] List<string> orderedKeys)
        {
            var banners = await _context.HomeSectionBanners.ToListAsync();
            for (int i = 0; i < orderedKeys.Count; i++)
            {
                var banner = banners.FirstOrDefault(b => b.Key == orderedKeys[i]);
                if (banner != null) banner.DisplayOrder = i;
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Order updated" });
        }

        // DELETE: api/admin/project-meetings/{id}
        [HttpDelete("project-meetings/{id}")]
        public async Task<IActionResult> DeleteProjectMeeting(int id)
        {
            var meeting = await _context.ProjectMeetingRequests.FindAsync(id);
            if (meeting == null) return NotFound("Meeting request not found");

            _context.ProjectMeetingRequests.Remove(meeting);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Meeting request deleted." });
        }

        // ==================================================
        // 🟢 إدارة المطورين / المشاريع (Primary & Resale) / المناطق
        // بتحل محل الليستات الهاردكودد في PropertiesService.cs و add-property.ts
        // ==================================================

        // ---------- Developers ----------

        [HttpGet("developers")]
        public async Task<IActionResult> GetDevelopers()
        {
            var developers = await _context.Developers
                .OrderBy(d => d.Name)
                .ToListAsync();
            return Ok(developers);
        }

        [HttpPost("developers")]
        public async Task<IActionResult> AddDeveloper([FromBody] DeveloperDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Code))
                return BadRequest("Name and Code are required.");

            if (await _context.Developers.AnyAsync(d => d.Name.ToLower() == dto.Name.Trim().ToLower()))
                return BadRequest("This developer already exists.");

            var developer = new Developer { Name = dto.Name.Trim(), Code = dto.Code.Trim().ToUpper() };
            _context.Developers.Add(developer);
            await _context.SaveChangesAsync();
            return Ok(developer);
        }

        [HttpDelete("developers/{id}")]
        public async Task<IActionResult> DeleteDeveloper(int id)
        {
            var developer = await _context.Developers.FindAsync(id);
            if (developer == null) return NotFound();

            _context.Developers.Remove(developer);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Deleted" });
        }

        // ---------- Projects (Primary & Resale) ----------

        // GET api/admin/projects?type=0&city=1
        [HttpGet("projects")]
        public async Task<IActionResult> GetProjects([FromQuery] int? type, [FromQuery] int? city)
        {
            var query = _context.Projects.Include(p => p.Developer).AsQueryable();

            if (type.HasValue) query = query.Where(p => (int)p.Type == type.Value);
            if (city.HasValue) query = query.Where(p => (int)p.City == city.Value);

            var projects = await query
                .OrderBy(p => p.Region)
                .ThenBy(p => p.Name)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Code,
                    Type = (int)p.Type,
                    City = (int)p.City,
                    p.Region,
                    p.DeveloperId,
                    DeveloperName = p.Developer != null ? p.Developer.Name : null
                })
                .ToListAsync();

            return Ok(projects);
        }

        [HttpPost("projects")]
        public async Task<IActionResult> AddProject([FromBody] ProjectDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Code))
                return BadRequest("Name and Code are required.");

            var type = (ProjectListingType)dto.Type;
            var city = (City)dto.City;

            if (await _context.Projects.AnyAsync(p => p.Name.ToLower() == dto.Name.Trim().ToLower() && p.Type == type && p.City == city))
                return BadRequest("This project already exists.");

            var project = new Project
            {
                Name = dto.Name.Trim(),
                Code = dto.Code.Trim(),
                Type = type,
                City = city,
                Region = string.IsNullOrWhiteSpace(dto.Region) ? null : dto.Region.Trim(),
                DeveloperId = dto.DeveloperId
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();
            return Ok(project);
        }

        [HttpDelete("projects/{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound();

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Deleted" });
        }

        // ---------- Regions ----------

        // GET api/admin/regions?city=1
        [HttpGet("regions")]
        public async Task<IActionResult> GetRegions([FromQuery] int? city)
        {
            var query = _context.Regions.AsQueryable();
            if (city.HasValue) query = query.Where(r => (int)r.City == city.Value);

            var regions = await query
                .OrderBy(r => r.Name)
                .Select(r => new
                {
                    r.Id,
                    r.Name,
                    r.ZoneCode,
                    City = (int)r.City
                })
                .ToListAsync();

            return Ok(regions);
        }

        [HttpPost("regions")]
        public async Task<IActionResult> AddRegion([FromBody] RegionDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Name is required.");

            var city = (City)dto.City;

            if (await _context.Regions.AnyAsync(r => r.Name.ToLower() == dto.Name.Trim().ToLower() && r.City == city))
                return BadRequest("This region already exists.");

            var region = new Region
            {
                Name = dto.Name.Trim(),
                ZoneCode = string.IsNullOrWhiteSpace(dto.ZoneCode) ? null : dto.ZoneCode.Trim(),
                City = city
            };

            _context.Regions.Add(region);
            await _context.SaveChangesAsync();
            return Ok(region);
        }

        [HttpDelete("regions/{id}")]
        public async Task<IActionResult> DeleteRegion(int id)
        {
            var region = await _context.Regions.FindAsync(id);
            if (region == null) return NotFound();

            _context.Regions.Remove(region);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Deleted" });
        }

        // 🟢 تسجيل كل عملية بحث بكل الفلاتر بتاعتها (Public - أي حد بيبحث بيتسجل)
        [HttpPost("log-search")]
        [AllowAnonymous]
        public async Task<IActionResult> LogSearch([FromBody] SearchLogDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var log = new SearchLog
            {
                SearchTerm = string.IsNullOrWhiteSpace(dto.SearchTerm) ? null : dto.SearchTerm.Trim(),
                ProjectName = string.IsNullOrWhiteSpace(dto.ProjectName) ? null : dto.ProjectName.Trim(),
                City = dto.City,
                PropertyType = dto.PropertyType,
                ListingType = dto.ListingType,
                MinPrice = dto.MinPrice,
                MaxPrice = dto.MaxPrice,
                MinPricePerMeter = dto.MinPricePerMeter,
                MaxPricePerMeter = dto.MaxPricePerMeter,
                MinRooms = dto.MinRooms,
                MaxRooms = dto.MaxRooms,
                MinBathrooms = dto.MinBathrooms,
                MaxBathrooms = dto.MaxBathrooms,
                MinFloor = dto.MinFloor,
                MaxFloor = dto.MaxFloor,
                UserId = userId
            };

            _context.SearchLogs.Add(log);
            await _context.SaveChangesAsync();
            return Ok();
        }

        // 🟢 كل وحدة وعندها كام View وكام Click (مترتبة من الأعلى للأقل)
        [HttpGet("properties-analytics")]
        public async Task<IActionResult> GetPropertiesAnalytics()
        {
            var records = await _context.AnalyticsRecords
                .Where(r => (r.ActionType == "PropertyView" || r.ActionType == "PropertyClick") && r.PropertyId != null)
                .ToListAsync();

            var properties = await _context.Properties
                .Select(p => new { p.Id, p.Title, p.Code, p.PropertyType, p.ListingType })
                .ToListAsync();

            var result = records
                .GroupBy(r => r.PropertyId)
                .Select(g =>
                {
                    var prop = properties.FirstOrDefault(p => p.Id == g.Key);
                    var views = g.Count(r => r.ActionType == "PropertyView");
                    var clicks = g.Count(r => r.ActionType == "PropertyClick");
                    return new
                    {
                        PropertyId = g.Key,
                        Title = prop?.Title,
                        Code = prop?.Code,
                        PropertyType = prop?.PropertyType,
                        ListingType = prop?.ListingType,
                        Views = views,
                        Clicks = clicks,
                        Total = views + clicks
                    };
                })
                .OrderByDescending(x => x.Total)
                .ToList();

            return Ok(result);
        }

        // 🟢 تحليل الفلاتر: أكتر كلمات بحث، أكتر رينجات أسعار/متر/غرف/أدوار، أكتر أنواع
        [HttpGet("search-analytics")]
        public async Task<IActionResult> GetSearchAnalytics()
        {
            var logs = await _context.SearchLogs.ToListAsync();

            var searchTerms = logs
                .Where(l => !string.IsNullOrWhiteSpace(l.SearchTerm))
                .GroupBy(l => l.SearchTerm!.Trim().ToLower())
                .Select(g => new { Term = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            var priceRanges = logs
                .Where(l => l.MinPrice.HasValue || l.MaxPrice.HasValue)
                .GroupBy(l => new { l.MinPrice, l.MaxPrice })
                .Select(g => new { g.Key.MinPrice, g.Key.MaxPrice, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            var pricePerMeterRanges = logs
                .Where(l => l.MinPricePerMeter.HasValue || l.MaxPricePerMeter.HasValue)
                .GroupBy(l => new { l.MinPricePerMeter, l.MaxPricePerMeter })
                .Select(g => new { g.Key.MinPricePerMeter, g.Key.MaxPricePerMeter, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            var roomsRanges = logs
                .Where(l => l.MinRooms.HasValue || l.MaxRooms.HasValue)
                .GroupBy(l => new { l.MinRooms, l.MaxRooms })
                .Select(g => new { g.Key.MinRooms, g.Key.MaxRooms, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            var bathroomsRanges = logs
                .Where(l => l.MinBathrooms.HasValue || l.MaxBathrooms.HasValue)
                .GroupBy(l => new { l.MinBathrooms, l.MaxBathrooms })
                .Select(g => new { g.Key.MinBathrooms, g.Key.MaxBathrooms, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            var floorRanges = logs
                .Where(l => l.MinFloor.HasValue || l.MaxFloor.HasValue)
                .GroupBy(l => new { l.MinFloor, l.MaxFloor })
                .Select(g => new { g.Key.MinFloor, g.Key.MaxFloor, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            var propertyTypes = logs
                .Where(l => l.PropertyType.HasValue)
                .GroupBy(l => l.PropertyType)
                .Select(g => new { PropertyType = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            var listingTypes = logs
                .Where(l => l.ListingType.HasValue)
                .GroupBy(l => l.ListingType)
                .Select(g => new { ListingType = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            var cities = logs
                .Where(l => l.City.HasValue)
                .GroupBy(l => l.City)
                .Select(g => new { City = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            return Ok(new
            {
                TotalSearches = logs.Count,
                SearchTerms = searchTerms,
                PriceRanges = priceRanges,
                PricePerMeterRanges = pricePerMeterRanges,
                RoomsRanges = roomsRanges,
                BathroomsRanges = bathroomsRanges,
                FloorRanges = floorRanges,
                PropertyTypes = propertyTypes,
                ListingTypes = listingTypes,
                Cities = cities
            });
        }

    }

    public class SetBrokerLimitDto
    {
        public int? Limit { get; set; }
    }
}