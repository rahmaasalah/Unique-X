using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using Unique_X.Data;
using Unique_X.DTOs.CRM;

namespace Unique_X.Helpers
{
    // 🟢 بيجمع (لكل عميل) ملخص الطلب + الوحدة اللي استفسر عنها، بـ Queries مجمّعة (مش Query لكل عميل)
    // ليه بنقرا الوحدة من كود الوحدة؟ لأن website-inquiry و website-visit-request بيسجلوا كود الوحدة في Notes الطلب
    // وفي Lead.CampaignName (المصدر Website)، ومفيش PropertyId متخزن في LeadRequest.
    public static class LeadRequestSummaryBuilder
    {
        // "Property Code: AR#123." -> AR#123
        private static readonly Regex CodeRegex = new(@"Property Code:\s*(\S+?)\.(?:\s|$)", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public static async Task<Dictionary<int, LeadRequestSummaryDto>> BuildAsync(AppDbContext context, List<int> leadIds)
        {
            var result = new Dictionary<int, LeadRequestSummaryDto>();
            if (leadIds == null || leadIds.Count == 0) return result;

            var leads = await context.Leads.AsNoTracking()
                .Where(l => leadIds.Contains(l.Id))
                .Select(l => new { l.Id, l.CampaignSource, l.CampaignName })
                .ToListAsync();

            var requests = await context.LeadRequests.AsNoTracking()
                .Where(r => leadIds.Contains(r.LeadId))
                .OrderBy(r => r.Id)
                .ToListAsync();

            var requestsByLead = requests.GroupBy(r => r.LeadId).ToDictionary(g => g.Key, g => g.ToList());

            // 1) نطلّع أكواد الوحدات اللي كل عميل استفسر عنها (بالترتيب، من غير تكرار)
            var codesByLead = new Dictionary<int, List<string>>();
            foreach (var lead in leads)
            {
                var codes = new List<string>();
                if (requestsByLead.TryGetValue(lead.Id, out var reqs))
                {
                    foreach (var r in reqs)
                    {
                        if (string.IsNullOrWhiteSpace(r.Notes)) continue;
                        foreach (Match m in CodeRegex.Matches(r.Notes))
                            if (!codes.Contains(m.Groups[1].Value, StringComparer.OrdinalIgnoreCase)) codes.Add(m.Groups[1].Value);
                    }
                }
                if (string.Equals(lead.CampaignSource, "Website", StringComparison.OrdinalIgnoreCase)
                    && !string.IsNullOrWhiteSpace(lead.CampaignName)
                    && !codes.Contains(lead.CampaignName, StringComparer.OrdinalIgnoreCase))
                    codes.Add(lead.CampaignName);

                codesByLead[lead.Id] = codes;
            }

            // 2) نجيب كل الوحدات المطلوبة مرة واحدة
            var allCodes = codesByLead.Values.SelectMany(c => c).Distinct().ToList();
            var propsByCode = new Dictionary<string, Models.Property>(StringComparer.OrdinalIgnoreCase);
            if (allCodes.Count > 0)
            {
                var props = await context.Properties.AsNoTracking()
                    .Where(p => p.Code != null && allCodes.Contains(p.Code))
                    .ToListAsync();
                foreach (var p in props)
                    if (!propsByCode.ContainsKey(p.Code!)) propsByCode[p.Code!] = p;
            }

            // 3) نبني الملخص لكل عميل
            foreach (var lead in leads)
            {
                var units = codesByLead[lead.Id]
                    .Where(c => propsByCode.ContainsKey(c))
                    .Select(c => propsByCode[c])
                    .Select(p => new LeadUnitSummaryDto
                    {
                        Id = p.Id,
                        Code = p.Code,
                        Price = p.Price,
                        Location = string.Join(" · ", new[] { Pretty(p.City.ToString()), p.Region, p.ProjectName }
                                            .Where(x => !string.IsNullOrWhiteSpace(x))),
                        PropertyType = Pretty(p.PropertyType.ToString()),
                        ListingType = Pretty(p.ListingType.ToString()),
                        Rooms = p.Rooms,
                        Bathrooms = p.Bathrooms,
                        Area = p.Area,
                        Floor = p.Floor,
                        Finishing = Pretty(p.Finishing.ToString()),
                        DeliveryYear = p.DeliveryYear
                    }).ToList();

                // الطلب اللي البروكر بيعدله هو أول LeadRequest (نفس اللي UpdateLeadDetails و GetLeadDetails بيستخدموه)
                var req = requestsByLead.TryGetValue(lead.Id, out var rl) ? rl.First() : null;

                var summary = new LeadRequestSummaryDto
                {
                    IsFromUnit = units.Count > 0,
                    Units = units,
                    Request = req == null ? null : new LeadRequestInfoDto
                    {
                        PropertyType = req.PropertyType,
                        Purpose = req.Purpose,
                        Cities = req.SelectedCities,
                        Regions = req.SelectedRegions,
                        Projects = req.SelectedProjects,
                        MinBudget = req.MinBudget,
                        MaxBudget = req.MaxBudget,
                        TotalAmount = req.TotalAmount,
                        MinRooms = req.MinRooms,
                        MaxRooms = req.MaxRooms,
                        MinBathrooms = req.MinBathrooms,
                        MaxBathrooms = req.MaxBathrooms,
                        PaymentMethod = req.PaymentMethod,
                        DownPayment = req.DownPayment,
                        InstallmentYears = req.InstallmentYears
                    }
                };

                if (units.Count > 0)
                {
                    summary.Source = "Unit";
                    summary.IsRequestEdited = req != null && IsEditedByBroker(req, units);
                }
                else if (string.Equals(lead.CampaignSource, "Recommendation", StringComparison.OrdinalIgnoreCase)
                         || string.Equals(lead.CampaignName, "Get Recommendation", StringComparison.OrdinalIgnoreCase))
                {
                    summary.Source = "Recommendation";
                }

                result[lead.Id] = summary;
            }

            return result;
        }

        // 🟢 الطلب اللي بيتسجل أوتوماتيك من استفسار الوحدة فيه بس: نوع الوحدة + الـ Listing Type + سعرها (TotalAmount).
        // لو أي حاجة تانية اتملت (ميزانية، مناطق، غرف، دفع...) أو القيم الأساسية اختلفت عن الوحدة = البروكر عدّل الطلب.
        private static bool IsEditedByBroker(Models.LeadRequest r, List<LeadUnitSummaryDto> units)
        {
            bool extraFilled =
                r.MinBudget > 0 || r.MaxBudget > 0 ||
                !string.IsNullOrWhiteSpace(r.SelectedRegions) || !string.IsNullOrWhiteSpace(r.SelectedProjects) ||
                !string.IsNullOrWhiteSpace(r.SelectedCities) || !string.IsNullOrWhiteSpace(r.PaymentMethod) ||
                !string.IsNullOrWhiteSpace(r.PreferredLocation) ||
                (r.MinRooms ?? 0) > 0 || (r.MaxRooms ?? 0) > 0 || (r.MinBathrooms ?? 0) > 0 || (r.MaxBathrooms ?? 0) > 0 ||
                (r.DownPayment ?? 0) > 0 || (r.InstallmentYears ?? 0) > 0 || (r.QuarterlyInstallment ?? 0) > 0;

            if (extraFilled) return true;

            bool matchesSomeUnit = units.Any(u =>
                SameSet(r.PropertyType, u.PropertyType) &&
                SameSet(r.Purpose, u.ListingType) &&
                (r.TotalAmount == null || r.TotalAmount == u.Price));

            return !matchesSomeUnit;
        }

        private static string Norm(string? s) =>
            new string((s ?? "").Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();

        // بيقارن "Apartment" بـ "Apartment" و "Resale Project" بـ "ResaleProject" (من غير حساسية لمسافات/حروف)
        private static bool SameSet(string? csv, string? single)
        {
            var set = (csv ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(Norm).Where(x => x.Length > 0).ToHashSet();
            if (set.Count == 0) return true; // فاضي = البروكر مسحه/مفيش قيمة، مش اختلاف
            return set.Count == 1 && set.Contains(Norm(single));
        }

        // "ResaleProject" -> "Resale Project" , "NorthCoast" -> "North Coast"
        private static string Pretty(string? s) =>
            string.IsNullOrEmpty(s) ? "" : Regex.Replace(s, "(?<=[a-z])(?=[A-Z])", " ");
    }
}