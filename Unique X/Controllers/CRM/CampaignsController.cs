using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.Models;

namespace Unique_X.Controllers.CRM
{
    [Route("api/crm/[controller]")]
    [ApiController]
    public class CampaignsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CampaignsController(AppDbContext context)
        {
            _context = context;
        }

        // جلب كل الحملات
        [HttpGet]
        public async Task<IActionResult> GetCampaigns()
        {
            var campaigns = await _context.Campaigns.ToListAsync();
            return Ok(campaigns);
        }

        // إضافة حملة جديدة
        [HttpPost]
        public async Task<IActionResult> CreateCampaign([FromBody] Campaign dto)
        {
            var campaign = new Campaign
            {
                Name = dto.Name,
                Source = dto.Source
            };

            _context.Campaigns.Add(campaign);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Campaign created successfully!", campaign });
        }

        // حذف حملة إعلانية
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCampaign(int id)
        {
            var campaign = await _context.Campaigns.FindAsync(id);
            if (campaign == null) return NotFound(new { message = "Campaign not found" });

            // 1. فك ارتباط الحملة بأي عملاء موجودين عشان الداتابيز ماترفضش الحذف
            var leads = await _context.Leads.Where(l => l.CampaignId == id).ToListAsync();
            foreach (var lead in leads)
            {
                lead.CampaignId = null;
            }

            // 2. حذف الحملة
            _context.Campaigns.Remove(campaign);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Campaign deleted successfully" });
        }
    }
}