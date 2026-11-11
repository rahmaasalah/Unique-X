using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs.Chat;
using Unique_X.Models;

namespace Unique_X.Helpers
{
    // مشاركة طلبات العملاء (LeadRequest) في الشات. بنبني نسخة آمنة من غير أي بيانات شخصية
    // (من غير اسم العميل أو تليفونه أو إيميله أو الملاحظات) لأن الشات ممكن يكون عام.
    public static class ChatShareHelper
    {
        private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

        public static ChatRequestDto ToDto(LeadRequest r) => new()
        {
            Id = r.Id,
            Purpose = r.Purpose,
            PropertyType = r.PropertyType,
            MinBudget = r.MinBudget,
            MaxBudget = r.MaxBudget,
            PaymentMethod = r.PaymentMethod,
            DownPayment = r.DownPayment,
            InstallmentYears = r.InstallmentYears,
            Cities = r.SelectedCities,
            Regions = r.SelectedRegions,
            Projects = r.SelectedProjects,
            PreferredLocation = r.PreferredLocation,
            MinRooms = r.MinRooms,
            MaxRooms = r.MaxRooms,
            MinBathrooms = r.MinBathrooms,
            MaxBathrooms = r.MaxBathrooms
        };

        // الطلب لازم يكون تابع لعميل عند البروكر ده (والعميل لسه معاه)
        public static async Task<ChatRequestDto?> BuildAsync(AppDbContext db, string brokerId, int leadRequestId)
        {
            var r = await db.LeadRequests.AsNoTracking()
                .Include(x => x.Lead)
                .FirstOrDefaultAsync(x => x.Id == leadRequestId && x.Lead.BrokerId == brokerId && !x.Lead.IsUnassigned);
            return r == null ? null : ToDto(r);
        }

        public static string Serialize(ChatRequestDto d) => JsonSerializer.Serialize(d, JsonOpts);

        public static ChatRequestDto? Deserialize(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return null;
            try { return JsonSerializer.Deserialize<ChatRequestDto>(json, JsonOpts); }
            catch { return null; }
        }
    }
}