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
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync());

        [HttpGet("all")]
        public async Task<IActionResult> GetAllAdmin() =>
            Ok(await _context.Blogs
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var blog = await _context.Blogs.FindAsync(id);
            return blog == null ? NotFound() : Ok(blog);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateBlogDto dto)
        {
            var blog = new Blog
            {
                Title = dto.Title,
                Excerpt = dto.Excerpt,
                Category = dto.Category,
                IsPublished = dto.IsPublished,
                PricePerMeterResale = dto.PricePerMeterResale,
                PricePerMeterPrimary = dto.PricePerMeterPrimary,
                Button1Label = dto.Button1Label,
                Button2Label = dto.Button2Label,
                Button3Label = dto.Button3Label,
                ProjectDetails = dto.ProjectDetails,
                MapEmbedUrl = dto.MapEmbedUrl,
                PaymentPlansJson = dto.PaymentPlansJson,
                UnitIdsJson = dto.UnitIdsJson,
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
            }

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
            blog.Category = dto.Category;
            blog.IsPublished = dto.IsPublished;
            blog.PricePerMeterResale = dto.PricePerMeterResale;
            blog.PricePerMeterPrimary = dto.PricePerMeterPrimary;
            blog.Button1Label = dto.Button1Label;
            blog.Button2Label = dto.Button2Label;
            blog.Button3Label = dto.Button3Label;
            blog.ProjectDetails = dto.ProjectDetails;
            blog.MapEmbedUrl = dto.MapEmbedUrl;
            blog.PaymentPlansJson = dto.PaymentPlansJson;
            blog.UnitIdsJson = dto.UnitIdsJson;
            blog.ArticleSectionsJson = dto.ArticleSectionsJson;
            blog.FaqsJson = dto.FaqsJson;
            blog.AdminPhone = dto.AdminPhone;
            blog.UpdatedAt = DateTime.UtcNow;

            // Slider images جديدة → أضفها لفوق القديمة
            if (dto.SliderImages != null && dto.SliderImages.Count > 0)
            {
                var existing = string.IsNullOrEmpty(blog.SliderImages)
                    ? new List<string>()
                    : blog.SliderImages.Split('|').ToList();

                foreach (var f in dto.SliderImages)
                {
                    var url = await UploadToCloudinary(f);
                    if (url != null) existing.Add(url);
                }
                blog.SliderImages = string.Join("|", existing);
            }

            if (dto.Button1Image != null) blog.Button1ImageUrl = await UploadToCloudinary(dto.Button1Image);
            if (dto.Button2Image != null) blog.Button2ImageUrl = await UploadToCloudinary(dto.Button2Image);
            if (dto.Button3Image != null) blog.Button3ImageUrl = await UploadToCloudinary(dto.Button3Image);
            if (dto.MasterPlanImage != null) blog.MasterPlanImageUrl = await UploadToCloudinary(dto.MasterPlanImage);

            await _context.SaveChangesAsync();
            return Ok(blog);
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
    }
}