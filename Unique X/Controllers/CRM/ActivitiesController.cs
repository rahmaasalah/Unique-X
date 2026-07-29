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

            // لو الميعاد فات، الفرونت إند بيبعت Status (Completed/Cancelled/Rescheduled) بدل ما تفضل Pending
            var status = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status : "Pending";
            var notes = dto.Notes;
            if (status == "Completed" && !string.IsNullOrWhiteSpace(dto.Feedback))
            {
                // نفس فكرة AddActivityFeedback: الفيدباك بيتحط جوه الـ Notes بعلامة [Feedback]
                notes = string.IsNullOrEmpty(notes) ? $"[Feedback]: {dto.Feedback}" : $"{notes}\n\n[Feedback]: {dto.Feedback}";
            }

            var activity = new LeadActivity
            {
                LeadId = dto.LeadId,
                ActivityType = dto.ActivityType,
                Summary = dto.Summary,
                DueDate = dto.DueDate,
                AssignedToId = dto.AssignedToId,
                Notes = notes,
                IsDone = false,
                Status = status,
                PropertyCode = dto.PropertyCode,
                PropertyName = dto.PropertyName,
                BrokerPhone = dto.BrokerPhone,
                ZoneId = dto.ZoneId,
                ListingType = dto.ListingType,
                Region = dto.Region,
                Project = dto.Project
            };

            _context.LeadActivities.Add(activity);
            await _context.SaveChangesAsync();

            var lead = await _context.Leads.FindAsync(dto.LeadId);
            if (lead != null) { lead.UpdatedAt = DateTime.UtcNow; lead.LastActionBy = "broker"; await _context.SaveChangesAsync(); }

            return Ok(new { message = "Activity scheduled successfully!", activityId = activity.Id });
        }

        // 1.b تعديل كامل لمهمة لسه Pending
        // ملحوظة: مودال التعديل بيجمع بس Type/Summary/DueDate/Notes/Status/Feedback،
        // فمش بنلمس Zone/ListingType/Region/Project/PropertyCode/PropertyName/BrokerPhone خالص هنا
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateActivity(int id, [FromBody] UpdateActivityDto dto)
        {
            var activity = await _context.LeadActivities.FindAsync(id);
            if (activity == null) return NotFound("Activity not found");

            if (activity.Status != "Pending")
                return BadRequest("Only pending activities can be edited.");

            if (!ModelState.IsValid) return BadRequest(ModelState);

            activity.ActivityType = dto.ActivityType;
            activity.Summary = dto.Summary;
            activity.DueDate = dto.DueDate;

            var notes = dto.Notes;
            var newStatus = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status : "Pending";
            activity.Status = newStatus;

            if (newStatus == "Completed" && !string.IsNullOrWhiteSpace(dto.Feedback))
            {
                notes = string.IsNullOrEmpty(notes) ? $"[Feedback]: {dto.Feedback}" : $"{notes}\n\n[Feedback]: {dto.Feedback}";
            }
            activity.Notes = notes;

            await _context.SaveChangesAsync();

            var lead = await _context.Leads.FindAsync(activity.LeadId);
            if (lead != null) { lead.UpdatedAt = DateTime.UtcNow; lead.LastActionBy = "broker"; await _context.SaveChangesAsync(); }

            return Ok(new { message = "Activity updated successfully!" });
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

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateActivityStatus(int id, [FromBody] string status)
        {
            var activity = await _context.LeadActivities.FindAsync(id);
            if (activity == null) return NotFound("Activity not found");
            activity.Status = status;
            await _context.SaveChangesAsync();

            var lead = await _context.Leads.FindAsync(activity.LeadId);
            if (lead != null) { lead.UpdatedAt = DateTime.UtcNow; lead.LastActionBy = "broker"; await _context.SaveChangesAsync(); }
            return Ok();
        }

        [HttpPut("{id}/reschedule")]
        public async Task<IActionResult> RescheduleActivity(int id, [FromBody] DateTime newDate)
        {
            var activity = await _context.LeadActivities.FindAsync(id);
            if (activity == null) return NotFound("Activity not found");
            activity.DueDate = newDate;
            activity.Status = "Pending";
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPut("{id}/feedback")]
        public async Task<IActionResult> AddActivityFeedback(int id, [FromBody] string feedback)
        {
            var activity = await _context.LeadActivities.FindAsync(id);
            if (activity == null) return NotFound("Activity not found");

            // 💡 خدعة ذكية: هنضيف الفيدباك على الملاحظات القديمة عشان منعملش Migration لداتابيز جديدة
            activity.Notes = string.IsNullOrEmpty(activity.Notes) ? $"[Feedback]: {feedback}" : $"{activity.Notes}\n\n[Feedback]: {feedback}";

            await _context.SaveChangesAsync();

            var lead = await _context.Leads.FindAsync(activity.LeadId);
            if (lead != null) { lead.UpdatedAt = DateTime.UtcNow; lead.LastActionBy = "broker"; await _context.SaveChangesAsync(); }
            return Ok();
        }
    }
}