using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs.CRM;
using Unique_X.Models;

namespace Unique_X.Controllers.CRM
{
    [Route("api/crm/[controller]")]
    [ApiController]
    public class VisitsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VisitsController(AppDbContext context)
        {
            _context = context;
        }

        // 1. إضافة زيارة جديدة
        [HttpPost]
        public async Task<IActionResult> CreateVisit([FromBody] CreateVisitDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var visit = new Visit
            {
                LeadId = dto.LeadId,
                BrokerId = dto.BrokerId,
                VisitDate = dto.VisitDate,
                Location = dto.Location,
                IsCompleted = false,
                Feedback = "", // لسه مفيش فيدباك لأن الزيارة لسه هتحصل
                PropertyCode = dto.PropertyCode,
                PropertyName = dto.PropertyName,
                BrokerPhone = dto.BrokerPhone,
                ZoneId = dto.ZoneId,
                ListingType = dto.ListingType,
                Region = dto.Region,
                Notes = dto.Notes,
                Project = dto.Project
            };

            _context.Visits.Add(visit);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Visit scheduled successfully!", visitId = visit.Id });
        }

        // 2. جلب كل الزيارات الخاصة ببروكر معين[
        [HttpGet("broker/{brokerId}")]
        public async Task<IActionResult> GetBrokerVisits(string brokerId)
        {
            var visits = await _context.Visits
                .Include(v => v.Lead)
                .Where(v => v.BrokerId == brokerId)
                .OrderBy(v => v.VisitDate)
                .Select(v => new VisitResponseDto
                {
                    Id = v.Id,
                    LeadId = v.LeadId,
                    LeadName = v.Lead.FullName,
                    LeadPhone = v.Lead.PhoneNumber,
                    PropertyCode = v.PropertyCode,
                    PropertyName = v.PropertyName,
                    BrokerPhone = v.BrokerPhone,
                    ZoneId = v.ZoneId,
                    ListingType = v.ListingType,
                    Region = v.Region,
                    Project = v.Project,
                    VisitDate = v.VisitDate,
                    Notes = v.Notes,
                    Location = v.Location,
                    Feedback = v.Feedback,
                    IsCompleted = v.IsCompleted
                }).ToListAsync();

            return Ok(visits);
        }

        // عكس حالة الزيارة (تم / لم يتم)
        [HttpPut("{id}/toggle-status")]
        public async Task<IActionResult> ToggleVisitStatus(int id)
        {
            var visit = await _context.Visits.FindAsync(id);
            if (visit == null) return NotFound("Visit not found");

            visit.IsCompleted = !visit.IsCompleted;
            _context.Visits.Update(visit);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Visit status updated!", isCompleted = visit.IsCompleted });
        }

        // حذف الزيارة
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVisit(int id)
        {
            var visit = await _context.Visits.FindAsync(id);
            if (visit == null) return NotFound("Visit not found");

            _context.Visits.Remove(visit);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Visit deleted successfully" });
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateVisitStatus(int id, [FromBody] string status)
        {
            var visit = await _context.Visits.FindAsync(id);
            if (visit == null) return NotFound("Visit not found");
            visit.Status = status;
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPut("{id}/reschedule")]
        public async Task<IActionResult> RescheduleVisit(int id, [FromBody] DateTime newDate)
        {
            var visit = await _context.Visits.FindAsync(id);
            if (visit == null) return NotFound("Visit not found");
            visit.VisitDate = newDate;
            visit.Status = "Pending"; // بترجع قيد الانتظار للميعاد الجديد
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPut("{id}/feedback")]
        public async Task<IActionResult> AddVisitFeedback(int id, [FromBody] string feedback)
        {
            var visit = await _context.Visits.FindAsync(id);
            if (visit == null) return NotFound("Visit not found");
            visit.Feedback = feedback;
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}