using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Unique_X.Data;
using Unique_X.DTOs;
using Unique_X.Models;
using Unique_X.Services.Interface;

namespace Unique_X.Controllers
{
    // 🟢 دي الـ Backend بتاعة "Blogs" اللي ظاهرة في الأدمن والموقع
    // سميناها Articles جوه الكود عشان في تعارض اسم مع Blog الموجودة أصلاً (بتاعة الـ Projects)
    [Route("api/[controller]")]
    [ApiController]
    public class ArticlesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPhotoService _photoService;

        public ArticlesController(AppDbContext context, IPhotoService photoService)
        {
            _context = context;
            _photoService = photoService;
        }

        private async Task<string?> UploadImage(IFormFile file)
        {
            var result = await _photoService.AddPhotoAsync(file);
            return result.Error == null ? result.SecureUrl?.AbsoluteUri : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _context.Articles
                .Where(a => a.IsPublished)
                .OrderBy(a => a.DisplayOrder)
                .ThenByDescending(a => a.PublishedAt)
                .ToListAsync());

        [HttpGet("all")]
        public async Task<IActionResult> GetAllAdmin() =>
            Ok(await _context.Articles
                .OrderBy(a => a.DisplayOrder)
                .ThenByDescending(a => a.PublishedAt)
                .ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var article = await _context.Articles.FindAsync(id);
            return article == null ? NotFound() : Ok(article);
        }

        // 🟢 مقالات مشابهة (Lookalike Blogs) - حسب عدد الكلمات المفتاحية المشتركة
        [HttpGet("{id}/related")]
        public async Task<IActionResult> GetRelated(int id, [FromQuery] int take = 4)
        {
            var current = await _context.Articles.FindAsync(id);
            if (current == null) return NotFound();

            var myKeywords = ParseKeywords(current.KeywordsJson);

            var others = await _context.Articles
                .Where(a => a.Id != id && a.IsPublished)
                .ToListAsync();

            var related = others
                .Select(a => new { Article = a, Shared = ParseKeywords(a.KeywordsJson).Intersect(myKeywords, StringComparer.OrdinalIgnoreCase).Count() })
                .Where(x => x.Shared > 0)
                .OrderByDescending(x => x.Shared)
                .ThenByDescending(x => x.Article.PublishedAt)
                .Take(take)
                .Select(x => x.Article)
                .ToList();

            // لو مفيش مقالات مشتركة في الكلمات المفتاحية، نرجع أحدث المقالات كـ fallback
            if (related.Count == 0)
            {
                related = others.OrderByDescending(a => a.PublishedAt).Take(take).ToList();
            }

            return Ok(related);
        }

        private static List<string> ParseKeywords(string? json)
        {
            if (string.IsNullOrEmpty(json)) return new List<string>();
            try { return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>(); }
            catch { return new List<string>(); }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateArticleDto dto)
        {
            var article = new Article
            {
                Title = dto.Title,
                Excerpt = dto.Excerpt,
                CoverCaption = dto.CoverCaption,
                WrittenBy = dto.WrittenBy,
                PublishedAt = dto.PublishedAt ?? DateTime.UtcNow,
                IsPublished = dto.IsPublished,
                Ad1Link = dto.Ad1Link,
                Ad2Link = dto.Ad2Link,
                Ad3Link = dto.Ad3Link,
                Ad4Link = dto.Ad4Link,
                Ad5Link = dto.Ad5Link,
                SectionsJson = dto.SectionsJson,
                KeywordsJson = dto.KeywordsJson,
            };

            if (dto.CoverImage != null) article.CoverImageUrl = await UploadImage(dto.CoverImage) ?? "";
            else if (!string.IsNullOrEmpty(dto.CoverImageUrl)) article.CoverImageUrl = dto.CoverImageUrl;

            if (dto.Ad1Media != null) article.Ad1Url = await _photoService.AddMediaAsync(dto.Ad1Media);
            if (dto.Ad2Media != null) article.Ad2Url = await _photoService.AddMediaAsync(dto.Ad2Media);
            if (dto.Ad3Media != null) article.Ad3Url = await _photoService.AddMediaAsync(dto.Ad3Media);
            if (dto.Ad4Media != null) article.Ad4Url = await _photoService.AddMediaAsync(dto.Ad4Media);
            if (dto.Ad5Media != null) article.Ad5Url = await _photoService.AddMediaAsync(dto.Ad5Media);

            _context.Articles.Add(article);
            await _context.SaveChangesAsync();
            return Ok(article);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] CreateArticleDto dto)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return NotFound();

            article.Title = dto.Title;
            article.Excerpt = dto.Excerpt;
            article.CoverCaption = dto.CoverCaption;
            article.WrittenBy = dto.WrittenBy;
            if (dto.PublishedAt.HasValue) article.PublishedAt = dto.PublishedAt.Value;
            article.IsPublished = dto.IsPublished;
            article.Ad1Link = dto.Ad1Link;
            article.Ad2Link = dto.Ad2Link;
            article.Ad3Link = dto.Ad3Link;
            article.Ad4Link = dto.Ad4Link;
            article.Ad5Link = dto.Ad5Link;
            article.SectionsJson = dto.SectionsJson;
            article.KeywordsJson = dto.KeywordsJson;
            article.UpdatedAt = DateTime.UtcNow;

            if (dto.CoverImage != null) article.CoverImageUrl = await UploadImage(dto.CoverImage) ?? article.CoverImageUrl;
            else if (!string.IsNullOrEmpty(dto.CoverImageUrl)) article.CoverImageUrl = dto.CoverImageUrl;

            if (dto.Ad1Media != null) article.Ad1Url = await _photoService.AddMediaAsync(dto.Ad1Media);
            if (dto.Ad2Media != null) article.Ad2Url = await _photoService.AddMediaAsync(dto.Ad2Media);
            if (dto.Ad3Media != null) article.Ad3Url = await _photoService.AddMediaAsync(dto.Ad3Media);
            if (dto.Ad4Media != null) article.Ad4Url = await _photoService.AddMediaAsync(dto.Ad4Media);
            if (dto.Ad5Media != null) article.Ad5Url = await _photoService.AddMediaAsync(dto.Ad5Media);

            await _context.SaveChangesAsync();
            return Ok(article);
        }

        // ترتيب الظهور بالـ drag & drop - الفرونت إند بيبعت الليستة كلها مرتبة كل مرة
        [HttpPut("reorder")]
        public async Task<IActionResult> Reorder([FromBody] List<int> orderedIds)
        {
            if (orderedIds == null || orderedIds.Count == 0) return BadRequest("No order provided");

            var articles = await _context.Articles.Where(a => orderedIds.Contains(a.Id)).ToListAsync();
            for (int i = 0; i < orderedIds.Count; i++)
            {
                var a = articles.FirstOrDefault(x => x.Id == orderedIds[i]);
                if (a != null) a.DisplayOrder = i;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Order updated successfully" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return NotFound();
            _context.Articles.Remove(article);
            await _context.SaveChangesAsync();
            return Ok();
        }

        // 🟢 مسح بانر إعلان واحد بس (slot من 1 لـ 5) - عشان الأدمن يقدر يمسحه ويحط غيره
        [HttpDelete("{id}/ad/{slot}")]
        public async Task<IActionResult> DeleteAdBanner(int id, int slot)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return NotFound();

            switch (slot)
            {
                case 1: article.Ad1Url = null; article.Ad1Link = null; break;
                case 2: article.Ad2Url = null; article.Ad2Link = null; break;
                case 3: article.Ad3Url = null; article.Ad3Link = null; break;
                case 4: article.Ad4Url = null; article.Ad4Link = null; break;
                case 5: article.Ad5Url = null; article.Ad5Link = null; break;
                default: return BadRequest("Invalid ad slot. Must be between 1 and 5.");
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Ad banner removed" });
        }
    }
}