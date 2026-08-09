using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs;
using Unique_X.Models;
using Unique_X.Services.Interface;

namespace Unique_X.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LaunchesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPhotoService _photoService;

        public LaunchesController(AppDbContext context, IPhotoService photoService)
        {
            _context = context;
            _photoService = photoService;
        }

        // ── رفع صورة على Cloudinary وإرجاع الـ URL ──
        private async Task<string?> UploadToCloudinary(IFormFile file)
        {
            var result = await _photoService.AddPhotoAsync(file);
            if (result.Error != null) return null;
            return result.SecureUrl?.AbsoluteUri;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _context.Launches
                .Where(b => b.IsPublished)
                .OrderBy(b => b.DisplayOrder)
                .ThenByDescending(b => b.CreatedAt)
                .ToListAsync());

        [HttpGet("all")]
        public async Task<IActionResult> GetAllAdmin() =>
            Ok(await _context.Launches
                .OrderBy(b => b.DisplayOrder)
                .ThenByDescending(b => b.CreatedAt)
                .ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var launch = await _context.Launches.FindAsync(id);
            return launch == null ? NotFound() : Ok(launch);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateLaunchDto dto)
        {
            var launch = new Launch
            {
                Title = dto.Title,
                Excerpt = dto.Excerpt,
                Zone = dto.Zone,
                ProjectName = dto.ProjectName,
                DeveloperName = dto.DeveloperName,
                IsPublished = dto.IsPublished,
                DeliveryDate = dto.DeliveryDate,
                PricePerMeterResale = dto.PricePerMeterResale,
                PricePerMeterPrimary = dto.PricePerMeterPrimary,
                DownPaymentPercentage = dto.DownPaymentPercentage,
                AvgDownPayment = dto.AvgDownPayment,
                Button1Label = dto.Button1Label,
                Button2Label = dto.Button2Label,
                Button3Label = dto.Button3Label,
                ProjectDetails = dto.ProjectDetails,
                MapEmbedUrl = dto.MapEmbedUrl,
                PaymentPlansJson = dto.PaymentPlansJson,
                ResaleUnitIdsJson = dto.ResaleUnitIdsJson,
                PrimaryUnitIdsJson = dto.PrimaryUnitIdsJson,
                RentUnitIdsJson = dto.RentUnitIdsJson,
                ArticleSectionsJson = dto.ArticleSectionsJson,
                FaqsJson = dto.FaqsJson,
                AdminPhone = dto.AdminPhone,
            };

            // Slider images → Cloudinary
            if (dto.SliderImages != null && dto.SliderImages.Count > 0)
            {
                var urls = new List<string>();
                foreach (var f in dto.SliderImages)
                {
                    var url = await UploadToCloudinary(f);
                    if (url != null) urls.Add(url);
                }
                launch.SliderImages = string.Join("|", urls);

                // لو الأدمن اختار صورة "main" من الصور الجديدة، تبقى هي الـ cover
                if (dto.MainNewImageIndex.HasValue && dto.MainNewImageIndex.Value >= 0 && dto.MainNewImageIndex.Value < urls.Count)
                {
                    launch.CoverImageUrl = urls[dto.MainNewImageIndex.Value];
                }
            }

            // لو الأدمن اختار صورة main من صورة موجودة بالفعل (نادر في Create، بس بنغطيها)
            if (!string.IsNullOrEmpty(dto.CoverImageUrl) && string.IsNullOrEmpty(launch.CoverImageUrl))
                launch.CoverImageUrl = dto.CoverImageUrl;

            if (dto.Button1Image != null) launch.Button1ImageUrl = await UploadToCloudinary(dto.Button1Image);
            if (dto.Button2Image != null) launch.Button2ImageUrl = await UploadToCloudinary(dto.Button2Image);
            if (dto.Button3Image != null) launch.Button3ImageUrl = await UploadToCloudinary(dto.Button3Image);
            if (dto.MasterPlanImage != null) launch.MasterPlanImageUrl = await UploadToCloudinary(dto.MasterPlanImage);

            _context.Launches.Add(launch);
            await _context.SaveChangesAsync();
            return Ok(launch);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] CreateLaunchDto dto)
        {
            var launch = await _context.Launches.FindAsync(id);
            if (launch == null) return NotFound();

            launch.Title = dto.Title;
            launch.Excerpt = dto.Excerpt;
            launch.Zone = dto.Zone;
            launch.ProjectName = dto.ProjectName;
            launch.DeveloperName = dto.DeveloperName;
            launch.IsPublished = dto.IsPublished;
            launch.DeliveryDate = dto.DeliveryDate;
            launch.PricePerMeterResale = dto.PricePerMeterResale;
            launch.PricePerMeterPrimary = dto.PricePerMeterPrimary;
            launch.DownPaymentPercentage = dto.DownPaymentPercentage;
            launch.AvgDownPayment = dto.AvgDownPayment;
            launch.Button1Label = dto.Button1Label;
            launch.Button2Label = dto.Button2Label;
            launch.Button3Label = dto.Button3Label;
            launch.ProjectDetails = dto.ProjectDetails;
            launch.MapEmbedUrl = dto.MapEmbedUrl;
            launch.PaymentPlansJson = dto.PaymentPlansJson;
            launch.ResaleUnitIdsJson = dto.ResaleUnitIdsJson;
            launch.PrimaryUnitIdsJson = dto.PrimaryUnitIdsJson;
            launch.RentUnitIdsJson = dto.RentUnitIdsJson;
            launch.ArticleSectionsJson = dto.ArticleSectionsJson;
            launch.FaqsJson = dto.FaqsJson;
            launch.AdminPhone = dto.AdminPhone;
            launch.UpdatedAt = DateTime.UtcNow;

            // Slider images جديدة → أضفها لفوق القديمة
            List<string> newUrls = new List<string>();
            if (dto.SliderImages != null && dto.SliderImages.Count > 0)
            {
                var existing = string.IsNullOrEmpty(launch.SliderImages)
                    ? new List<string>()
                    : launch.SliderImages.Split('|').ToList();

                foreach (var f in dto.SliderImages)
                {
                    var url = await UploadToCloudinary(f);
                    if (url != null) newUrls.Add(url);
                }
                existing.AddRange(newUrls);
                launch.SliderImages = string.Join("|", existing);
            }

            // تحديد صورة الـ cover/main:
            // لو اختار صورة من الصور الجديدة اللي هيرفعها دلوقتي
            if (dto.MainNewImageIndex.HasValue && dto.MainNewImageIndex.Value >= 0 && dto.MainNewImageIndex.Value < newUrls.Count)
            {
                launch.CoverImageUrl = newUrls[dto.MainNewImageIndex.Value];
            }
            // لو اختار صورة من الصور الموجودة بالفعل (Cloudinary URL)
            else if (!string.IsNullOrEmpty(dto.CoverImageUrl))
            {
                launch.CoverImageUrl = dto.CoverImageUrl;
            }

            if (dto.Button1Image != null) launch.Button1ImageUrl = await UploadToCloudinary(dto.Button1Image);
            if (dto.Button2Image != null) launch.Button2ImageUrl = await UploadToCloudinary(dto.Button2Image);
            if (dto.Button3Image != null) launch.Button3ImageUrl = await UploadToCloudinary(dto.Button3Image);
            if (dto.MasterPlanImage != null) launch.MasterPlanImageUrl = await UploadToCloudinary(dto.MasterPlanImage);

            await _context.SaveChangesAsync();
            return Ok(launch);
        }

        // ترتيب الظهور بالـ drag & drop - الفرونت إند بيبعت الليستة كلها مرتبة كل مرة
        [HttpPut("reorder")]
        public async Task<IActionResult> Reorder([FromBody] List<int> orderedIds)
        {
            if (orderedIds == null || orderedIds.Count == 0) return BadRequest("No order provided");

            var launches = await _context.Launches.Where(b => orderedIds.Contains(b.Id)).ToListAsync();
            for (int i = 0; i < orderedIds.Count; i++)
            {
                var launch = launches.FirstOrDefault(b => b.Id == orderedIds[i]);
                if (launch != null) launch.DisplayOrder = i;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Order updated successfully" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var launch = await _context.Launches.FindAsync(id);
            if (launch == null) return NotFound();
            _context.Launches.Remove(launch);
            await _context.SaveChangesAsync();
            return Ok();
        }

        // حذف صورة واحدة من الـ slider
        [HttpDelete("{id}/slider-image")]
        public async Task<IActionResult> DeleteSliderImage(int id, [FromBody] string imageUrl)
        {
            var launch = await _context.Launches.FindAsync(id);
            if (launch == null) return NotFound();

            var images = string.IsNullOrEmpty(launch.SliderImages)
                ? new List<string>()
                : launch.SliderImages.Split('|').ToList();

            images.Remove(imageUrl);
            launch.SliderImages = string.Join("|", images);
            await _context.SaveChangesAsync();
            return Ok();
        }

        // 🟢 زرار "Schedule Meeting" في صفحة تفاصيل المشروع - متاح لأي زائر (مسجل دخول أو لأ)
        [HttpPost("{id}/schedule-meeting")]
        public async Task<IActionResult> ScheduleMeeting(int id, [FromBody] ScheduleMeetingDto dto)
        {
            var launch = await _context.Launches.FindAsync(id);
            if (launch == null) return NotFound("Project not found");

            var meeting = new LaunchMeetingRequest
            {
                LaunchId = launch.Id,
                ProjectName = launch.ProjectName ?? launch.Title,
                FullName = dto.FullName,
                Phone = dto.Phone,
                MeetingDate = dto.MeetingDate,
                Notes = dto.Notes,
                IsContacted = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.LaunchMeetingRequests.Add(meeting);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Meeting request received successfully!", meetingId = meeting.Id });
        }

        // 🟢 حفظ ترتيب صور الـ Photo Slider بعد الـ drag & drop في الأدمن
        [HttpPut("{id}/reorder-slider-images")]
        public async Task<IActionResult> ReorderSliderImages(int id, [FromBody] List<string> orderedImageUrls)
        {
            var launch = await _context.Launches.FindAsync(id);
            if (launch == null) return NotFound("Project not found");

            var currentImages = string.IsNullOrEmpty(launch.SliderImages)
                ? new List<string>()
                : launch.SliderImages.Split('|').ToList();

            // نتأكد إن الترتيب الجديد بيحتوي على نفس الصور بالظبط (مفيش صورة اتضافت أو اتشالت من هنا)
            if (orderedImageUrls == null || orderedImageUrls.Count != currentImages.Count ||
                !orderedImageUrls.All(currentImages.Contains))
            {
                return BadRequest("The provided order doesn't match the current set of images.");
            }

            launch.SliderImages = string.Join("|", orderedImageUrls);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Image order updated successfully!" });
        }

        // ============== Admin: Launch Meeting Requests ==============
        // 🟢 الأدمن بيشوف كل طلبات الـ "Schedule Meeting" الخاصة بكل اللونشز في مكان واحد

        [HttpGet("meetings")]
        public async Task<IActionResult> GetAllMeetings() =>
            Ok(await _context.LaunchMeetingRequests
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync());

        [HttpPatch("meetings/{id}/toggle-contacted")]
        public async Task<IActionResult> ToggleMeetingContacted(int id)
        {
            var meeting = await _context.LaunchMeetingRequests.FindAsync(id);
            if (meeting == null) return NotFound();

            meeting.IsContacted = !meeting.IsContacted;
            await _context.SaveChangesAsync();

            return Ok(new { isContacted = meeting.IsContacted });
        }

        [HttpDelete("meetings/{id}")]
        public async Task<IActionResult> DeleteMeeting(int id)
        {
            var meeting = await _context.LaunchMeetingRequests.FindAsync(id);
            if (meeting == null) return NotFound();

            _context.LaunchMeetingRequests.Remove(meeting);
            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}