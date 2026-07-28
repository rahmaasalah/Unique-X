using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using System.Text;
using System.Net;

namespace Unique_X.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BlogPreviewController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BlogPreviewController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/blogpreview/5
        // بيرجع صفحة HTML بسيطة فيها Open Graph meta tags فقط لاستخدامها في معاينة اللينكات
        // (واتساب، فيسبوك، تليجرام...) - مش مخصصة للمستخدم العادي
        // نفس فكرة PropertyPreviewController بالظبط، لكن لصفحة البلوج/المشروع
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPreview(int id)
        {
            var blog = await _context.Blogs.FirstOrDefaultAsync(b => b.Id == id);

            string title = "Betk - عقارك في مصر";
            string description = "تفاصيل مشروع على منصة Betk";
            string imageUrl = "https://betk.property/logo.jpeg";
            string pageUrl = $"https://betk.property/blog/{id}";

            if (blog != null)
            {
                title = $"{blog.Title} | Betk";

                description = string.IsNullOrWhiteSpace(blog.Excerpt)
                    ? $"{blog.Zone} - {blog.ProjectName}".Trim(' ', '-')
                    : blog.Excerpt;

                if (description.Length > 200)
                {
                    description = description.Substring(0, 200) + "...";
                }

                // نفس منطق getCoverImage في blog.service.ts: CoverImageUrl الأول، وإلا أول صورة سلايدر
                var cover = !string.IsNullOrWhiteSpace(blog.CoverImageUrl)
                    ? blog.CoverImageUrl
                    : blog.SliderImages?.Split('|', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();

                if (!string.IsNullOrWhiteSpace(cover))
                {
                    imageUrl = cover;
                }
            }

            string Escape(string s) => WebUtility.HtmlEncode(s ?? "");

            var html = $@"<!DOCTYPE html>
<html lang=""en"">
<head>
<meta charset=""utf-8"">
<title>{Escape(title)}</title>
<meta property=""og:title"" content=""{Escape(title)}"">
<meta property=""og:description"" content=""{Escape(description)}"">
<meta property=""og:image"" content=""{Escape(imageUrl)}"">
<meta property=""og:url"" content=""{Escape(pageUrl)}"">
<meta property=""og:type"" content=""website"">
<meta property=""og:site_name"" content=""Betk"">
<meta name=""twitter:card"" content=""summary_large_image"">
<meta name=""twitter:title"" content=""{Escape(title)}"">
<meta name=""twitter:description"" content=""{Escape(description)}"">
<meta name=""twitter:image"" content=""{Escape(imageUrl)}"">
<meta http-equiv=""refresh"" content=""0; url={Escape(pageUrl)}"">
</head>
<body>
<p>Redirecting to <a href=""{Escape(pageUrl)}"">{Escape(pageUrl)}</a></p>
</body>
</html>";

            return Content(html, "text/html", Encoding.UTF8);
        }
    }
}