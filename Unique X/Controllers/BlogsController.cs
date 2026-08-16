using ExcelDataReader;
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
    public class BlogsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPhotoService _photoService;

        public BlogsController(AppDbContext context, IPhotoService photoService)
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
            Ok(await _context.Blogs
                .Where(b => b.IsPublished)
                .OrderBy(b => b.DisplayOrder)
                .ThenByDescending(b => b.CreatedAt)
                .ToListAsync());

        [HttpGet("all")]
        public async Task<IActionResult> GetAllAdmin() =>
            Ok(await _context.Blogs
                .OrderBy(b => b.DisplayOrder)
                .ThenByDescending(b => b.CreatedAt)
                .ToListAsync());

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var blog = await _context.Blogs.FindAsync(id);
            return blog == null ? NotFound() : Ok(blog);
        }

        // 🟢 Financial Chart بتاع المشروع - بيرجع تاريخ سعر المتر (Resale + Primary) عبر السنين
        // من الشيت العام اللي رفعه الأدمن من تاب "Financial Charts" (Projects)
        // بنستقبل مرشحين للاسم (ProjectName والـ Title) عشان الأدمن يقدر يكتب أي واحد فيهم في الشيت والاتنين يشتغلوا
        [HttpGet("financial-history")]
        public async Task<IActionResult> GetProjectFinancialHistory([FromQuery] string projectName, [FromQuery] string? altName = null)
        {
            if (string.IsNullOrEmpty(projectName)) return BadRequest("Project name is required");

            var candidates = new List<string> { projectName.Trim() };
            if (!string.IsNullOrWhiteSpace(altName) && !altName.Trim().Equals(projectName.Trim(), StringComparison.OrdinalIgnoreCase))
                candidates.Add(altName.Trim());

            var fileRecord = await _context.ProjectFinancialFiles.OrderByDescending(f => f.UploadedAt).FirstOrDefaultAsync();
            if (fileRecord == null || fileRecord.FileData == null)
                return Ok(new List<object>());

            var history = new List<(int Year, decimal? Resale, decimal? Primary)>();

            try
            {
                System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
                using var stream = new MemoryStream(fileRecord.FileData);

                // 🟢 التعرف التلقائي: لو الملف CSV نستخدم القارئ الخاص بيه، ولو إكسيل نستخدم العادي
                var ext = Path.GetExtension(fileRecord.FileName).ToLower();
                using var reader = ext == ".csv"
                    ? ExcelDataReader.ExcelReaderFactory.CreateCsvReader(stream)
                    : ExcelDataReader.ExcelReaderFactory.CreateReader(stream);

                var result = reader.AsDataSet(new ExcelDataReader.ExcelDataSetConfiguration()
                {
                    ConfigureDataTable = (_) => new ExcelDataReader.ExcelDataTableConfiguration() { UseHeaderRow = true }
                });

                var dataTable = result.Tables[0];

                // 🟢 البحث الذكي عن الأعمدة: Project Name / Year / Resale Price / Primary Price
                int nameCol = -1, yearCol = -1, resaleCol = -1, primaryCol = -1;
                for (int i = 0; i < dataTable.Columns.Count; i++)
                {
                    var colName = dataTable.Columns[i].ColumnName.Trim().ToLower();
                    if (colName.Contains("project")) nameCol = i;
                    else if (colName.Contains("year")) yearCol = i;
                    else if (colName.Contains("resale")) resaleCol = i;
                    else if (colName.Contains("primary")) primaryCol = i;
                }

                // لو ملقاش عمود الاسم أو السنة، يرجع فاضي
                if (nameCol == -1 || yearCol == -1)
                    return Ok(new List<object>());

                foreach (System.Data.DataRow row in dataTable.Rows)
                {
                    var rowName = row[nameCol]?.ToString()?.Trim();
                    if (string.IsNullOrEmpty(rowName) || !candidates.Any(c => c.Equals(rowName, StringComparison.OrdinalIgnoreCase)))
                        continue;

                    try
                    {
                        if (row[yearCol] == DBNull.Value) continue;
                        int year = Convert.ToInt32(row[yearCol]);

                        decimal? resalePrice = (resaleCol != -1 && row[resaleCol] != DBNull.Value)
                            ? Convert.ToDecimal(row[resaleCol]) : null;
                        decimal? primaryPrice = (primaryCol != -1 && row[primaryCol] != DBNull.Value)
                            ? Convert.ToDecimal(row[primaryCol]) : null;

                        history.Add((year, resalePrice, primaryPrice));
                    }
                    catch { /* لو فيه صف بايظ في الإكسيل يتجاهله ويكمل */ }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Excel Parsing Error: {ex.Message}");
                return Ok(new List<object>());
            }

            // ترتيب من الأقدم للأحدث عشان الرسم البياني يبقى بترتيب زمني صح
            var sorted = history
                .OrderBy(h => h.Year)
                .Select(h => new { h.Year, ResalePricePerMeter = h.Resale, PrimaryPricePerMeter = h.Primary })
                .ToList();

            return Ok(sorted);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateBlogDto dto)
        {
            var blog = new Blog
            {
                Title = dto.Title,
                Excerpt = dto.Excerpt,
                Zone = dto.Zone,
                ProjectName = dto.ProjectName,
                DeveloperName = dto.DeveloperName,
                IsPublished = dto.IsPublished,
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
                blog.SliderImages = string.Join("|", urls);

                // لو الأدمن اختار صورة "main" من الصور الجديدة، تبقى هي الـ cover
                if (dto.MainNewImageIndex.HasValue && dto.MainNewImageIndex.Value >= 0 && dto.MainNewImageIndex.Value < urls.Count)
                {
                    blog.CoverImageUrl = urls[dto.MainNewImageIndex.Value];
                }
            }

            // لو الأدمن اختار صورة main من صورة موجودة بالفعل (نادر في Create، بس بنغطيها)
            if (!string.IsNullOrEmpty(dto.CoverImageUrl) && string.IsNullOrEmpty(blog.CoverImageUrl))
                blog.CoverImageUrl = dto.CoverImageUrl;

            if (dto.Button1Image != null) blog.Button1ImageUrl = await UploadToCloudinary(dto.Button1Image);
            if (dto.Button2Image != null) blog.Button2ImageUrl = await UploadToCloudinary(dto.Button2Image);
            if (dto.Button3Image != null) blog.Button3ImageUrl = await UploadToCloudinary(dto.Button3Image);
            if (dto.MasterPlanImage != null) blog.MasterPlanImageUrl = await UploadToCloudinary(dto.MasterPlanImage);

            _context.Blogs.Add(blog);
            await _context.SaveChangesAsync();
            return Ok(blog);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] CreateBlogDto dto)
        {
            var blog = await _context.Blogs.FindAsync(id);
            if (blog == null) return NotFound();

            blog.Title = dto.Title;
            blog.Excerpt = dto.Excerpt;
            blog.Zone = dto.Zone;
            blog.ProjectName = dto.ProjectName;
            blog.DeveloperName = dto.DeveloperName;
            blog.IsPublished = dto.IsPublished;
            blog.PricePerMeterResale = dto.PricePerMeterResale;
            blog.PricePerMeterPrimary = dto.PricePerMeterPrimary;
            blog.DownPaymentPercentage = dto.DownPaymentPercentage;
            blog.AvgDownPayment = dto.AvgDownPayment;
            blog.Button1Label = dto.Button1Label;
            blog.Button2Label = dto.Button2Label;
            blog.Button3Label = dto.Button3Label;
            blog.ProjectDetails = dto.ProjectDetails;
            blog.MapEmbedUrl = dto.MapEmbedUrl;
            blog.PaymentPlansJson = dto.PaymentPlansJson;
            blog.ResaleUnitIdsJson = dto.ResaleUnitIdsJson;
            blog.PrimaryUnitIdsJson = dto.PrimaryUnitIdsJson;
            blog.RentUnitIdsJson = dto.RentUnitIdsJson;
            blog.ArticleSectionsJson = dto.ArticleSectionsJson;
            blog.FaqsJson = dto.FaqsJson;
            blog.AdminPhone = dto.AdminPhone;
            blog.UpdatedAt = DateTime.UtcNow;

            // Slider images جديدة → أضفها لفوق القديمة
            List<string> newUrls = new List<string>();
            if (dto.SliderImages != null && dto.SliderImages.Count > 0)
            {
                var existing = string.IsNullOrEmpty(blog.SliderImages)
                    ? new List<string>()
                    : blog.SliderImages.Split('|').ToList();

                foreach (var f in dto.SliderImages)
                {
                    var url = await UploadToCloudinary(f);
                    if (url != null) newUrls.Add(url);
                }
                existing.AddRange(newUrls);
                blog.SliderImages = string.Join("|", existing);
            }

            // تحديد صورة الـ cover/main:
            // لو اختار صورة من الصور الجديدة اللي هيرفعها دلوقتي
            if (dto.MainNewImageIndex.HasValue && dto.MainNewImageIndex.Value >= 0 && dto.MainNewImageIndex.Value < newUrls.Count)
            {
                blog.CoverImageUrl = newUrls[dto.MainNewImageIndex.Value];
            }
            // لو اختار صورة من الصور الموجودة بالفعل (Cloudinary URL)
            else if (!string.IsNullOrEmpty(dto.CoverImageUrl))
            {
                blog.CoverImageUrl = dto.CoverImageUrl;
            }

            if (dto.Button1Image != null) blog.Button1ImageUrl = await UploadToCloudinary(dto.Button1Image);
            if (dto.Button2Image != null) blog.Button2ImageUrl = await UploadToCloudinary(dto.Button2Image);
            if (dto.Button3Image != null) blog.Button3ImageUrl = await UploadToCloudinary(dto.Button3Image);
            if (dto.MasterPlanImage != null) blog.MasterPlanImageUrl = await UploadToCloudinary(dto.MasterPlanImage);

            await _context.SaveChangesAsync();
            return Ok(blog);
        }

        // ترتيب الظهور بالـ drag & drop - الفرونت إند بيبعت الليستة كلها مرتبة كل مرة
        [HttpPut("reorder")]
        public async Task<IActionResult> Reorder([FromBody] List<int> orderedIds)
        {
            if (orderedIds == null || orderedIds.Count == 0) return BadRequest("No order provided");

            var blogs = await _context.Blogs.Where(b => orderedIds.Contains(b.Id)).ToListAsync();
            for (int i = 0; i < orderedIds.Count; i++)
            {
                var blog = blogs.FirstOrDefault(b => b.Id == orderedIds[i]);
                if (blog != null) blog.DisplayOrder = i;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Order updated successfully" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var blog = await _context.Blogs.FindAsync(id);
            if (blog == null) return NotFound();
            _context.Blogs.Remove(blog);
            await _context.SaveChangesAsync();
            return Ok();
        }

        // حذف صورة واحدة من الـ slider
        [HttpDelete("{id}/slider-image")]
        public async Task<IActionResult> DeleteSliderImage(int id, [FromBody] string imageUrl)
        {
            var blog = await _context.Blogs.FindAsync(id);
            if (blog == null) return NotFound();

            var images = string.IsNullOrEmpty(blog.SliderImages)
                ? new List<string>()
                : blog.SliderImages.Split('|').ToList();

            images.Remove(imageUrl);
            blog.SliderImages = string.Join("|", images);
            await _context.SaveChangesAsync();
            return Ok();
        }

        // 🟢 زرار "Schedule Meeting" في صفحة تفاصيل المشروع - متاح لأي زائر (مسجل دخول أو لأ)
        [HttpPost("{id}/schedule-meeting")]
        public async Task<IActionResult> ScheduleMeeting(int id, [FromBody] ScheduleMeetingDto dto)
        {
            var blog = await _context.Blogs.FindAsync(id);
            if (blog == null) return NotFound("Project not found");

            var meeting = new ProjectMeetingRequest
            {
                BlogId = blog.Id,
                ProjectName = blog.ProjectName ?? blog.Title,
                FullName = dto.FullName,
                Phone = dto.Phone,
                MeetingDate = dto.MeetingDate,
                Notes = dto.Notes,
                IsContacted = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.ProjectMeetingRequests.Add(meeting);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Meeting request received successfully!", meetingId = meeting.Id });
        }

        // 🟢 حفظ ترتيب صور الـ Photo Slider بعد الـ drag & drop في الأدمن
        [HttpPut("{id}/reorder-slider-images")]
        public async Task<IActionResult> ReorderSliderImages(int id, [FromBody] List<string> orderedImageUrls)
        {
            var blog = await _context.Blogs.FindAsync(id);
            if (blog == null) return NotFound("Project not found");

            var currentImages = string.IsNullOrEmpty(blog.SliderImages)
                ? new List<string>()
                : blog.SliderImages.Split('|').ToList();

            // نتأكد إن الترتيب الجديد بيحتوي على نفس الصور بالظبط (مفيش صورة اتضافت أو اتشالت من هنا)
            if (orderedImageUrls == null || orderedImageUrls.Count != currentImages.Count ||
                !orderedImageUrls.All(currentImages.Contains))
            {
                return BadRequest("The provided order doesn't match the current set of images.");
            }

            blog.SliderImages = string.Join("|", orderedImageUrls);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Image order updated successfully!" });
        }
    }
}