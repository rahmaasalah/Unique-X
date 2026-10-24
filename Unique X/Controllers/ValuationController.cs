using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Unique_X.DTOs;
using Unique_X.Valuation;
using static Unique_X.Models.PropEnums;

namespace Unique_X.Controllers
{
    [ApiController]
    [Route("api/valuation")]
    public class ValuationController : ControllerBase
    {
        private readonly IValuationService _svc;

        public ValuationController(IValuationService svc) => _svc = svc;

        // GET api/valuation/options
        // القوائم اللي بتظهر في الفورم (المدن، أنواع العقار، التشطيب، حالة التسليم)
        // بتتجاب من الـ enums مباشرة، فلو ضفتوا قيمة جديدة تظهر لوحدها
        [AllowAnonymous]
        [HttpGet("options")]
        public IActionResult GetOptions() => Ok(new
        {
            cities = Enum.GetNames<City>(),
            propertyTypes = Enum.GetNames<PropertyType>(),
            finishingTypes = Enum.GetNames<FinishingType>(),
            deliveryStatuses = Enum.GetNames<DeliveryStatus>()
        });

        // GET api/valuation/regions?city=Cairo
        [AllowAnonymous]
        [HttpGet("regions")]
        public async Task<ActionResult<List<string>>> GetRegions([FromQuery] City city, CancellationToken ct)
            => Ok(await _svc.GetRegionsAsync(city, ct));

        // POST api/valuation/estimate
        [AllowAnonymous]
        [EnableRateLimiting("valuation")]
        [HttpPost("estimate")]
        public async Task<ActionResult<ValuationResult>> Estimate(
            [FromBody] ValuationRequestDto req, CancellationToken ct)
        {
            var result = await _svc.EstimateAsync(req, ct);
            return Ok(result);
        }
    }
}