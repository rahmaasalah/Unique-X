using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs;
using Unique_X.Models;

namespace Unique_X.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobApplicationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly ILogger<JobApplicationsController> _logger;

        // المسار اللي هتُحفظ فيه ملفات الـ CVs داخل الكونتينر
        private const string CvFolderName = "cvs";

        public JobApplicationsController(AppDbContext context, IConfiguration config, ILogger<JobApplicationsController> logger)
        {
            _context = context;
            _config = config;
            _logger = logger;
        }

        private string GetCvStoragePath()
        {
            // /app/uploads/cvs
            var basePath = Path.Combine(AppContext.BaseDirectory, "uploads", CvFolderName);
            if (!Directory.Exists(basePath))
            {
                Directory.CreateDirectory(basePath);
            }
            return basePath;
        }

        private async Task<string?> SaveCvLocallyAsync(IFormFile file)
        {
            try
            {
                var storagePath = GetCvStoragePath();

                // اسم ملف فريد لتجنب التعارض
                var safeFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
                var fullPath = Path.Combine(storagePath, safeFileName);

                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                _logger.LogInformation("CV saved locally: {FileName}", safeFileName);

                // بنخزن اسم الملف بس، وهنستخدمه في endpoint التحميل
                return safeFileName;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving CV locally: {Message}", ex.Message);
                return null;
            }
        }

        [HttpPost]
        public async Task<IActionResult> Submit([FromForm] CreateJobApplicationDto dto)
        {
            string? cvFileName = null;

            if (dto.CvFile != null && dto.CvFile.Length > 0)
            {
                cvFileName = await SaveCvLocallyAsync(dto.CvFile);
            }

            var application = new JobApplication
            {
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                Address = dto.Address,
                City = dto.City,
                HasJob = dto.HasJob,
                WorkPlace = dto.WorkPlace,
                HasLaptop = dto.HasLaptop,
                JobTitle = dto.JobTitle,
                EnglishLevel = dto.EnglishLevel,
                CrmTools = dto.CrmTools,
                PastExperiences = dto.PastExperiences,
                RealEstateBackground = dto.RealEstateBackground,
                CompanyType = dto.CompanyType,
                ZoneWorkedOn = dto.ZoneWorkedOn,
                ProjectPreparation = dto.ProjectPreparation,
                VisitSite = dto.VisitSite,
                DealsClosing = dto.DealsClosing,
                SalesLastQuarter = dto.SalesLastQuarter,
                CvUrl = cvFileName
            };

            _context.JobApplications.Add(application);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Application submitted successfully!" });
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var apps = await _context.JobApplications
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
            return Ok(apps);
        }

        // تحميل/فتح ملف الـ CV - مثال: GET /api/jobapplications/5/cv
        [HttpGet("{id}/cv")]
        public async Task<IActionResult> DownloadCv(int id)
        {
            var app = await _context.JobApplications.FindAsync(id);
            if (app == null || string.IsNullOrEmpty(app.CvUrl))
            {
                return NotFound("CV not found.");
            }

            var storagePath = GetCvStoragePath();
            var fullPath = Path.Combine(storagePath, app.CvUrl);

            if (!System.IO.File.Exists(fullPath))
            {
                return NotFound("CV file not found on server.");
            }

            var contentType = "application/octet-stream";
            var ext = Path.GetExtension(app.CvUrl).ToLowerInvariant();
            if (ext == ".pdf") contentType = "application/pdf";
            else if (ext == ".doc") contentType = "application/msword";
            else if (ext == ".docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

            var bytes = await System.IO.File.ReadAllBytesAsync(fullPath);

            // اسم تحميل أوضح للأدمن: اسم المتقدم + امتداد الملف
            var downloadName = $"{app.FullName}_CV{ext}";

            return File(bytes, contentType, downloadName);
        }

        [HttpPut("{id}/confirm")]
        public async Task<IActionResult> Confirm(int id)
        {
            var app = await _context.JobApplications.FindAsync(id);
            if (app == null) return NotFound();
            app.Status = "Confirmed";
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPut("{id}/schedule")]
        public async Task<IActionResult> ScheduleInterview(int id, [FromBody] DateTime interviewDate)
        {
            var app = await _context.JobApplications.FindAsync(id);
            if (app == null) return NotFound();
            app.InterviewDate = interviewDate;
            app.Status = "Scheduled";
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}