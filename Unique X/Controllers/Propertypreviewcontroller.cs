using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using System.Text;
using System.Net;

namespace Unique_X.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PropertyPreviewController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PropertyPreviewController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/propertypreview/5
        // بيرجع صفحة HTML بسيطة فيها Open Graph meta tags فقط لاستخدامها في معاينة اللينكات
        // (واتساب، فيسبوك، تليجرام...) - مش مخصصة للمستخدم العادي
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPreview(int id)
        {
            var property = await _context.Properties
                .Include(p => p.Photos)
                .FirstOrDefaultAsync(p => p.Id == id);

            string title = "Betk - عقارك في مصر";
            string description = "تفاصيل عقار على منصة Betk";
            string imageUrl = "https://betk.property/assets/logo.jpeg";
            string pageUrl = $"https://betk.property/property-details/{id}";

            if (property != null)
            {
                title = $"{property.Title} | Betk";

                var priceText = property.Price > 0 ? $"{property.Price:N0} EGP" : "";
                description = string.IsNullOrWhiteSpace(property.Description)
                    ? $"{property.Region} - {priceText}".Trim(' ', '-')
                    : property.Description;

                if (description.Length > 200)
                {
                    description = description.Substring(0, 200) + "...";
                }

                var mainPhoto = property.Photos?.FirstOrDefault(ph => ph.IsMain)
                                 ?? property.Photos?.FirstOrDefault();

                if (mainPhoto != null && !string.IsNullOrWhiteSpace(mainPhoto.Url))
                {
                    imageUrl = mainPhoto.Url;
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