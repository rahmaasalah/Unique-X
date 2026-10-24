using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Unique_X.Models;
using Unique_X.Data;
using Unique_X.DTOs;
using static Unique_X.Models.PropEnums;

namespace Unique_X.Valuation
{
    public class ValuationService : IValuationService
    {
        // نقارن بوحدات إعادة البيع فقط (Resale + ResaleProject)
        // أسعار الـ Primary بيحددها المطور، والـ Rent إيجار، فمش بنستخدمهم
        private static readonly ListingType[] ComparableTypes =
            { ListingType.Resale, ListingType.ResaleProject };

        private readonly AppDbContext _db;
        private readonly ValuationOptions _opt;

        public ValuationService(AppDbContext db, IOptions<ValuationOptions> opt)
        {
            _db = db;
            _opt = opt.Value;
        }

        // وحدة مشابهة (Comparable) بعد تجهيزها للمقارنة
        private sealed class Comp
        {
            public double Ppm;               // سعر المتر
            public int Area;
            public string Region = "";
            public FinishingType Finishing;
            public DeliveryStatus Delivery;
            public int Floor;
            public int BuildYear;
            public int? DeliveryYear;
            public int TotalFloors;
            public bool Elevator, Parking, Security, Balcony, Licensed, Garden, Pool;
        }

        // المناطق المتاحة في مدينة معينة (للـ dropdown في الفورم)
        public async Task<List<string>> GetRegionsAsync(City city, CancellationToken ct = default)
        {
            var names = await _db.Properties.AsNoTracking()
                .Where(p => ComparableTypes.Contains(p.ListingType) && p.IsApproved && p.IsActive
                         && !p.IsSuspended && p.City == city && p.Region != null && p.Region != "")
                .Select(p => p.Region)
                .ToListAsync(ct);

            // نجمّع الكتابات المختلفة لنفس المنطقة ونعرض أكتر شكل مستخدم
            return names
                .GroupBy(n => NormalizeAr(n))
                .Where(g => g.Key != "")
                .Select(g => g.GroupBy(x => x.Trim()).OrderByDescending(x => x.Count()).First().Key)
                .OrderBy(n => n)
                .ToList();
        }

        public async Task<ValuationResult> EstimateAsync(ValuationRequestDto r, CancellationToken ct = default)
        {
            var result = await CalculateAsync(r, ct);

            if (result.Success)
            {
                _db.Set<ValuationLog>().Add(new ValuationLog
                {
                    City = r.City,
                    Region = r.Region,
                    PropertyType = r.PropertyType,
                    Area = r.Area,
                    Finishing = r.Finishing,
                    EstimatedTotalMid = result.TotalMid,
                    Confidence = result.Confidence,
                    ComparablesCount = result.ComparablesCount,
                    RequestJson = JsonSerializer.Serialize(r)
                });
                await _db.SaveChangesAsync(ct);
            }
            return result;
        }

        private async Task<ValuationResult> CalculateAsync(ValuationRequestDto r, CancellationToken ct)
        {
            // 1) الوحدات المعروضة للبيع فقط، المعتمدة والنشطة وغير المباعة،
            //    في نفس المدينة ونفس نوع العقار
            var raw = await _db.Properties.AsNoTracking()
                .Where(p => ComparableTypes.Contains(p.ListingType)
                         && p.IsApproved && p.IsActive && !p.IsSuspended && !p.IsSold
                         && p.Price > 0 && p.Area > 0
                         && p.City == r.City && p.PropertyType == r.PropertyType)
                .Select(p => new
                {
                    p.Price,
                    p.Area,
                    p.Region,
                    p.Finishing,
                    p.DeliveryStatus,
                    p.Floor,
                    p.BuildYear,
                    p.ElevatorsCount,
                    p.DeliveryYear,
                    p.TotalFloors,
                    p.HasParking,
                    p.HasSecurity,
                    p.HasBalcony,
                    p.IsLicensed,
                    p.HasGarden,
                    p.HasPool
                })
                .ToListAsync(ct);

            // سعر المتر بيتحسب من Price/Area (مش من PricePerMeter لأنه ممكن يكون فاضي)
            var pool = raw.Select(p => new Comp
            {
                Ppm = (double)p.Price / p.Area,
                Area = p.Area,
                Region = NormalizeAr(p.Region),
                Finishing = p.Finishing,
                Delivery = p.DeliveryStatus,
                Floor = p.Floor,
                BuildYear = p.BuildYear,
                DeliveryYear = p.DeliveryYear,
                TotalFloors = p.TotalFloors,
                Elevator = p.ElevatorsCount > 0,
                Parking = p.HasParking,
                Security = p.HasSecurity,
                Balcony = p.HasBalcony,
                Licensed = p.IsLicensed,
                Garden = p.HasGarden,
                Pool = p.HasPool
            }).ToList();

            if (pool.Count < 3)
                return new ValuationResult
                {
                    Success = false,
                    Message = "There is not enough data for this property type in this city to give a reliable estimate yet."
                };

            // 2) استبعاد الأسعار الشاذة (غلط إدخال أو مبالغ فيها) بالنسبة لوسيط المدينة+النوع
            double cityMedian = Median(pool.Select(c => c.Ppm).ToList());
            pool = pool.Where(c => c.Ppm >= cityMedian * 0.4 && c.Ppm <= cityMedian * 2.5).ToList();

            // 3) لو في وحدات كفاية في نفس المنطقة نكتفي بيها، وإلا نوسّع على المدينة بوزن أقل
            string region = NormalizeAr(r.Region);
            var sameRegion = pool.Where(c => c.Region == region).ToList();
            bool regionOnly = sameRegion.Count >= _opt.MinCompsSameRegion;
            var candidates = regionOnly ? sameRegion : pool;

            // 4) نحسب درجة التشابه ونختار أفضل الوحدات
            var scored = candidates
                .Select(c => (comp: c, score: Score(c, r, region)))
                .Where(x => x.score >= _opt.MinScore)
                .OrderByDescending(x => x.score)
                .Take(_opt.TopComps)
                .ToList();

            if (scored.Count < 3)
            {
                // fallback: وسيط المدينة+النوع بنطاق واسع وثقة منخفضة
                return Build(r, cityMedian * 0.85, cityMedian, cityMedian * 1.15, scored.Count, "Low",
                    "Preliminary estimate based on average prices for this property type in the city, as there are few similar units in the area.");
            }

            // 5) الوسيط الموزون والنطاق (الربع الأول والثالث)
            var items = scored.Select(x => (v: x.comp.Ppm, w: x.score)).ToList();
            double q25 = WeightedQuantile(items, 0.25);
            double q50 = WeightedQuantile(items, 0.50);
            double q75 = WeightedQuantile(items, 0.75);

            // نطاق أدنى ±5% حتى لو الأسعار متقاربة جداً
            q25 = Math.Min(q25, q50 * 0.95);
            q75 = Math.Max(q75, q50 * 1.05);

            // 6) مستوى الثقة
            double avgScore = scored.Average(x => x.score);
            string confidence =
                scored.Count >= 10 && avgScore >= 0.6 && regionOnly ? "High" :
                scored.Count >= 5 ? "Medium" : "Low";

            string basis = regionOnly
                ? $"Based on {scored.Count} similar units in {r.Region}."
                : $"Based on {scored.Count} similar units in the city (not enough units in the same region).";

            return Build(r, q25, q50, q75, scored.Count, confidence, basis);
        }

        // تجهيز النتيجة النهائية (تطبيق عامل الخصم + تقريب الأرقام)
        private ValuationResult Build(ValuationRequestDto r, double lo, double mid, double hi,
            int n, string confidence, string basis)
        {
            double f = _opt.AskingToMarketFactor;
            decimal Ppm(double v) => Math.Round((decimal)(v * f) / 100m) * 100m;                // لأقرب 100 جنيه
            decimal Tot(double v) => Math.Round((decimal)(v * f) * r.Area / 10000m) * 10000m;   // لأقرب 10,000 جنيه

            return new ValuationResult
            {
                Success = true,
                PricePerMeterLow = Ppm(lo),
                PricePerMeterMid = Ppm(mid),
                PricePerMeterHigh = Ppm(hi),
                TotalLow = Tot(lo),
                TotalMid = Tot(mid),
                TotalHigh = Tot(hi),
                ComparablesCount = n,
                Confidence = confidence,
                Basis = basis
            };
        }

        // درجة التشابه من 0 لـ 1: كل فرق بيقلل الدرجة
        private static double Score(Comp c, ValuationRequestDto r, string region)
        {
            double s = 1.0;

            s *= c.Region == region ? 1.0 : 0.35;

            double areaDiff = Math.Abs(c.Area - r.Area) / (double)r.Area;
            s *= Math.Max(0.2, 1 - areaDiff);

            s *= c.Finishing == r.Finishing ? 1.0 : 0.6;
            s *= c.Delivery == r.DeliveryStatus ? 1.0 : 0.5;

            if (r.BuildYear > 0 && c.BuildYear > 0)
                s *= Math.Max(0.5, 1 - Math.Abs(c.BuildYear - r.BuildYear) / 40.0);

            // سنة التسليم (للوحدات تحت الإنشاء): كل سنة فرق بتقلل التشابه 10%
            if (r.DeliveryYear.HasValue && c.DeliveryYear.HasValue)
                s *= Math.Max(0.5, 1 - Math.Abs(c.DeliveryYear.Value - r.DeliveryYear.Value) * 0.1);

            // عدد أدوار البناية: عمارة 5 أدوار غير برج 20 دور
            if (r.TotalFloors > 0 && c.TotalFloors > 0)
                s *= 1 - Math.Min(0.4, Math.Abs(c.TotalFloors - r.TotalFloors) * 0.03);

            s *= Math.Max(0.7, 1 - Math.Abs(c.Floor - r.Floor) * 0.02);

            int mismatches = 0;
            if (c.Elevator != r.HasElevator) mismatches++;
            if (c.Parking != r.HasParking) mismatches++;
            if (c.Security != r.HasSecurity) mismatches++;
            if (c.Balcony != r.HasBalcony) mismatches++;
            if (c.Licensed != r.IsLicensed) mismatches++;
            if (c.Garden != r.HasGarden) mismatches++;
            if (c.Pool != r.HasPool) mismatches++;
            s *= Math.Max(0.7, 1 - mismatches * 0.04);

            return s;
        }

        private static double Median(List<double> v)
        {
            v.Sort();
            int n = v.Count;
            return n % 2 == 1 ? v[n / 2] : (v[n / 2 - 1] + v[n / 2]) / 2.0;
        }

        private static double WeightedQuantile(List<(double v, double w)> items, double q)
        {
            var sorted = items.OrderBy(i => i.v).ToList();
            double total = sorted.Sum(i => i.w), cum = 0;
            foreach (var i in sorted)
            {
                cum += i.w;
                if (cum >= q * total) return i.v;
            }
            return sorted[^1].v;
        }

        // توحيد كتابة المناطق: أ/إ/آ→ا ، ة→ه ، ى→ي ، شيل التشكيل والمسافات الزايدة
        public static string NormalizeAr(string? s)
        {
            if (string.IsNullOrWhiteSpace(s)) return "";
            var sb = new StringBuilder();
            foreach (var ch in s.Trim().ToLowerInvariant())
            {
                if (ch >= '\u064B' && ch <= '\u0652') continue;
                sb.Append(ch switch
                {
                    'أ' or 'إ' or 'آ' => 'ا',
                    'ة' => 'ه',
                    'ى' => 'ي',
                    _ => ch
                });
            }
            return string.Join(' ', sb.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries));
        }
    }
}