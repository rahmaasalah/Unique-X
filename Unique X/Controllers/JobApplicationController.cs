using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
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

        public JobApplicationsController(AppDbContext context, IConfiguration config, ILogger<JobApplicationsController> logger)
        {
            _context = context;
            _config = config;
            _logger = logger;
        }

        private async Task<string?> UploadToDriveAsync(IFormFile file)
        {
            try
            {
                var clientEmail = _config["GoogleDrive:ClientEmail"];
                var privateKey = _config["GoogleDrive:PrivateKey"];
                var folderId = _config["GoogleDrive:FolderId"];

                _logger.LogError("ClientEmail: {ClientEmail}", clientEmail);
                _logger.LogError("PrivateKey length: {Length}", privateKey?.Length ?? 0);
                _logger.LogError("FolderId: {FolderId}", folderId);

                if (string.IsNullOrEmpty(clientEmail) || string.IsNullOrEmpty(privateKey))
                {
                    _logger.LogError("Google Drive credentials are missing!");
                    return null;
                }

                var credential = new ServiceAccountCredential(
                    new ServiceAccountCredential.Initializer(clientEmail)
                    {
                        Scopes = new[] { DriveService.Scope.DriveFile }
                    }.FromPrivateKey(privateKey));

                var service = new DriveService(new BaseClientService.Initializer
                {
                    HttpClientInitializer = credential,
                    ApplicationName = "BETK CV Uploader"
                });

                var fileMetadata = new Google.Apis.Drive.v3.Data.File
                {
                    Name = $"{Guid.NewGuid()}_{file.FileName}",
                    Parents = new[] { folderId }
                };

                using var stream = file.OpenReadStream();
                var request = service.Files.Create(fileMetadata, stream, file.ContentType);
                request.Fields = "id, webViewLink";
                await request.UploadAsync();

                _logger.LogError("Upload successful. Link: {Link}", request.ResponseBody?.WebViewLink);
                return request.ResponseBody?.WebViewLink;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Drive upload error: {Message}", ex.Message);
                return null;
            }
        }

        [HttpPost]
        public async Task<IActionResult> Submit([FromForm] CreateJobApplicationDto dto)
        {
            string? cvUrl = null;

            if (dto.CvFile != null && dto.CvFile.Length > 0)
            {
                cvUrl = await UploadToDriveAsync(dto.CvFile);
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
                CvUrl = cvUrl
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