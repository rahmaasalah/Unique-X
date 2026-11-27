using System.Globalization;
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

        // 🟢 الطلب بيظهر في الشات كرسالة نصية مطولة (مش كارد)، وبدون أي بيانات شخصية (لا اسم ولا رقم ولا إيميل ولا ملاحظات)
        public static string ToText(ChatRequestDto r)
        {
            var lines = new List<string> { "📋 Client request" };

            static string Csv(string? s) => string.Join(", ",
                (s ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
            static string Money(decimal v) => v.ToString("N0", CultureInfo.InvariantCulture);
            static string Rng(decimal? min, decimal? max, string? unit = null)
            {
                var u = string.IsNullOrEmpty(unit) ? "" : " " + unit;
                if (min.HasValue && max.HasValue) return min == max ? $"{Money(min.Value)}{u}" : $"{Money(min.Value)} – {Money(max.Value)}{u}";
                if (min.HasValue) return $"from {Money(min.Value)}{u}";
                if (max.HasValue) return $"up to {Money(max.Value)}{u}";
                return "";
            }
            void Add(string label, string? value)
            {
                if (!string.IsNullOrWhiteSpace(value)) lines.Add($"• {label}: {value}");
            }

            Add("Looking for", Csv(r.Purpose));
            Add("Property type", Csv(r.PropertyType));
            Add("City", Csv(r.Cities));
            Add("Areas", Csv(r.Regions));
            Add("Projects", Csv(r.Projects));
            Add("Preferred location", r.PreferredLocation?.Trim());
            Add("Budget", Rng(r.MinBudget > 0 ? (decimal?)r.MinBudget : null, r.MaxBudget > 0 ? (decimal?)r.MaxBudget : null, "EGP"));
            Add("Rooms", Rng(r.MinRooms, r.MaxRooms));
            Add("Bathrooms", Rng(r.MinBathrooms, r.MaxBathrooms));

            var payment = r.PaymentMethod?.Trim() ?? "";
            if (r.DownPayment.HasValue && r.DownPayment > 0) payment += (payment.Length > 0 ? ", " : "") + $"down payment {Money(r.DownPayment.Value)} EGP";
            if (r.InstallmentYears.HasValue && r.InstallmentYears > 0) payment += (payment.Length > 0 ? ", " : "") + $"{r.InstallmentYears} years";
            Add("Payment", payment);

            return string.Join("\n", lines);
        }

        // بيدمج نص الرسالة (لو فيه) مع نص الطلب المتشارك (لو فيه)
        public static string? MessageText(string? text, string? requestJson)
        {
            var req = Deserialize(requestJson);
            var parts = new List<string>();
            if (!string.IsNullOrWhiteSpace(text)) parts.Add(text!);
            if (req != null) parts.Add(ToText(req));
            return parts.Count == 0 ? null : string.Join("\n\n", parts);
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