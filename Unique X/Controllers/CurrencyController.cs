using Microsoft.AspNetCore.Mvc;

namespace Unique_X.Controllers
{
    [Route("api/currency")]
    [ApiController]
    public class CurrencyController : ControllerBase
    {
        // كاش بسيط في الميموري - بيتحدث كل 6 ساعات بس عشان منضغطش على الـ API الخارجي بكل زيارة
        private static DateTime _lastFetch = DateTime.MinValue;
        private static Dictionary<string, decimal> _cachedRates = new();
        private static readonly object _lock = new();

        private readonly IHttpClientFactory _httpClientFactory;

        public CurrencyController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        // GET /api/currency/rates
        // بيرجع سعر صرف الجنيه المصري مقابل الدولار والريال السعودي (1 EGP = ? USD/SAR)
        [HttpGet("rates")]
        public async Task<IActionResult> GetRates()
        {
            var needsRefresh = _cachedRates.Count == 0 || (DateTime.UtcNow - _lastFetch).TotalHours > 6;

            if (needsRefresh)
            {
                try
                {
                    var client = _httpClientFactory.CreateClient();
                    client.Timeout = TimeSpan.FromSeconds(8);

                    var response = await client.GetStringAsync("https://open.er-api.com/v6/latest/EGP");
                    using var doc = System.Text.Json.JsonDocument.Parse(response);
                    var rates = doc.RootElement.GetProperty("rates");

                    lock (_lock)
                    {
                        _cachedRates = new Dictionary<string, decimal>
                        {
                            ["EGP"] = 1m,
                            ["USD"] = rates.GetProperty("USD").GetDecimal(),
                            ["SAR"] = rates.GetProperty("SAR").GetDecimal()
                        };
                        _lastFetch = DateTime.UtcNow;
                    }
                }
                catch
                {
                    // لو الـ API الخارجي وقع ومفيش قيم متخزنة قبل كده، بنستخدم قيم تقريبية احتياطية
                    if (_cachedRates.Count == 0)
                    {
                        _cachedRates = new Dictionary<string, decimal>
                        {
                            ["EGP"] = 1m,
                            ["USD"] = 0.021m,
                            ["SAR"] = 0.078m
                        };
                    }
                }
            }

            return Ok(new { rates = _cachedRates, lastUpdated = _lastFetch });
        }
    }
}