using ExcelDataReader;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Unique_X.Data;
using Unique_X.DTOs;
using Unique_X.Services;
using Unique_X.Services.Interface;

namespace Unique_X.Controllers
{
    [Route("api/properties")]
    [ApiController]
    public class PropertiesController : ControllerBase
    {
        private readonly IPropertiesService _propertiesService;

        public PropertiesController(IPropertiesService propertiesService)
        {
            _propertiesService = propertiesService;
        }


        [HttpPost("add")]
        [Authorize]
        [DisableRequestSizeLimit]
        public async Task<IActionResult> AddProperty([FromForm] PropertyFormDto dto)
        {
            var brokerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (brokerId == null)
                return Unauthorized();
            if (dto.Photos == null || dto.Photos.Count == 0)
            {
                return BadRequest("Photos must be uploded");
            }

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _propertiesService.AddPropertyAsync(dto, brokerId);

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] PropertyFilterDto filter)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var result = await _propertiesService.GetAllPropertiesAsync(filter, userId);

            if (result == null || !result.Any())
            {
                string message = "There are no properties that match your selections at the moment.";

                if (filter.City.HasValue)
                {
                    var cityName = Enum.GetName(typeof(Unique_X.Models.PropEnums.City), filter.City.Value);
                    message = $"There are no properties in {cityName}.";
                }
                else if (filter.MinPrice.HasValue || filter.MaxPrice.HasValue)
                {
                    message = "There are no properties in the requested price range.";
                }

                return Ok(new { Message = message, Data = result });
            }

            return Ok(result);
        }

        [HttpGet("my-properties")]
        [Authorize]
        public async Task<IActionResult> GetMyProperties()
        {
            var brokerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (brokerId == null) return Unauthorized();

            var result = await _propertiesService.GetBrokerPropertiesAsync(brokerId);
            return Ok(result);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateProperty(int id, [FromForm] UpdatePropertyDto dto)
        {
            var brokerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var result = await _propertiesService.UpdatePropertyAsync(id, dto, brokerId);

            if (result == null)
                return NotFound("Can't update this property");

            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteProperty(int id)
        {
            var brokerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var deleted = await _propertiesService.DeletePropertyAsync(id, brokerId);

            if (!deleted)
                return BadRequest("Failed to delete property");

            return Ok("Deleted Successfully");
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _propertiesService.GetPropertyByIdAsync(id);
            return result != null ? Ok(result) : NotFound();
        }

        [HttpPatch("{id}/mark-as-sold")]
        [Authorize]
        public async Task<IActionResult> MarkAsSold(int id)
        {
            var brokerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (brokerId == null) return Unauthorized();

            var result = await _propertiesService.MarkAsSoldAsync(id, brokerId);

            if (!result)
                return NotFound("Property not found or unauthorized");

            return Ok(new { Message = "Property marked as sold successfully" });
        }

        [HttpPatch("{id}/set-main/{photoId}")]
        [Authorize]
        public async Task<IActionResult> SetMainPhoto(int id, int photoId)
        {
            var brokerId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (brokerId == null) return Unauthorized();

            var result = await _propertiesService.SetExistingPhotoAsMainAsync(id, photoId, brokerId);

            return result ? Ok(new { Message = "Main photo updated" }) : BadRequest("Failed to update main photo");
        }

        [HttpGet("{code}/financial-history")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFinancialHistory(string code, [FromServices] AppDbContext context)
        {
            if (string.IsNullOrEmpty(code)) return BadRequest("Code is required");

            var fileRecord = await context.FinancialFiles.OrderByDescending(f => f.UploadedAt).FirstOrDefaultAsync();
            if (fileRecord == null || fileRecord.FileData == null)
                return Ok(new List<object>());

            var history = new List<object>();

            try
            {
                System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
                using var stream = new MemoryStream(fileRecord.FileData);

                // 🟢 1. التعرف التلقائي: لو الملف CSV نستخدم القارئ الخاص بيه، ولو إكسيل نستخدم العادي
                var ext = Path.GetExtension(fileRecord.FileName).ToLower();
                using var reader = ext == ".csv"
                    ? ExcelDataReader.ExcelReaderFactory.CreateCsvReader(stream)
                    : ExcelDataReader.ExcelReaderFactory.CreateReader(stream);

                var result = reader.AsDataSet(new ExcelDataReader.ExcelDataSetConfiguration()
                {
                    ConfigureDataTable = (_) => new ExcelDataReader.ExcelDataTableConfiguration() { UseHeaderRow = true }
                });

                var dataTable = result.Tables[0];

                // 🟢 2. البحث الذكي عن العواميد (عشان نتجنب مشكلة المسافات وحالة الحروف)
                int codeCol = -1, priceCol = -1, yearCol = -1;
                for (int i = 0; i < dataTable.Columns.Count; i++)
                {
                    var colName = dataTable.Columns[i].ColumnName.Trim().ToLower();
                    if (colName == "code") codeCol = i;
                    else if (colName.Contains("price")) priceCol = i;
                    else if (colName.Contains("year")) yearCol = i;
                }

                // لو ملقاش العواميد يرجع فاضي
                if (codeCol == -1 || priceCol == -1 || yearCol == -1)
                    return Ok(new List<object>());

                // 3. استخراج البيانات
                foreach (System.Data.DataRow row in dataTable.Rows)
                {
                    var rowCode = row[codeCol]?.ToString()?.Trim();

                    if (!string.IsNullOrEmpty(rowCode) && rowCode.Equals(code.Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        try
                        {
                            var priceRaw = row[priceCol];
                            var yearRaw = row[yearCol];

                            if (priceRaw != DBNull.Value && yearRaw != DBNull.Value)
                            {
                                decimal price = Convert.ToDecimal(priceRaw);
                                int year = Convert.ToInt32(yearRaw);

                                history.Add(new { Year = year, Price = price });
                            }
                        }
                        catch { /* لو فيه صف بايظ في الإكسيل يتجاهله ويكمل */ }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Excel Parsing Error: {ex.Message}");
                return Ok(new List<object>());
            }

            return Ok(history);
        }
    }
}