using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs.CRM;
using Unique_X.Models;

namespace Unique_X.Controllers.CRM
{
    [Route("api/crm/[controller]")]
    [ApiController]
    public class ActivitiesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ActivitiesController(AppDbContext context)
        {
            _context = context;
        }

        // 1. إضافة مهمة جديدة للبروكر
        [HttpPost]
        public async Task<IActionResult> CreateActivity([FromBody] CreateActivityDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var activity = new LeadActivity
            {
                LeadId = dto.LeadId,
                ActivityType = dto.ActivityType,
                Summary = dto.Summary,
                DueDate = dto.DueDate,
                AssignedToId = dto.AssignedToId,
                Notes = dto.Notes,
                IsDone = false
            };

            _context.LeadActivities.Add(activity);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Activity scheduled successfully!", activityId = activity.Id });
        }

        // 2. تحديث المهمة إنها خلصت (Mark Done)
        [HttpPut("{id}/toggle-status")]
        public async Task<IActionResult> ToggleTaskStatus(int id)
        {
            var activity = await _context.LeadActivities.FindAsync(id);
            if (activity == null) return NotFound("Activity not found");

            // بنعكس الحالة (لو true تبقى false والعكس)
            activity.IsDone = !activity.IsDone;
            _context.LeadActivities.Update(activity);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Status updated!", isDone = activity.IsDone });
        }
    }
}