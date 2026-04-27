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
                PropertyId = dto.PropertyId,
                VisitDate = dto.VisitDate,
                Location = dto.Location,
                IsCompleted = false,
                Feedback = "" // لسه مفيش فيدباك لأن الزيارة لسه هتحصل
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
                    PropertyId = v.PropertyId,
                    VisitDate = v.VisitDate,
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
    }
}