using System.Text.Json;
using Unique_X.DTOs;
using Unique_X.Models;

namespace Unique_X.Helpers
{
    // ============================================================
    // 🟢 أدوار الفيلا الديناميكية
    // ============================================================
    // الأدوار بتتخزن في Property.FloorsJson كـ JSON، كل دور: { level, rooms, baths, reception }
    //   level: -1 = Basement, 0 = Ground, 1 = First, 2 = Second, 3 = Third ...
    //   (وكل دور فيه كمان kitchens - عدد المطابخ في الدور ده)
    //
    // - Normalize(): بتنضف الـ JSON اللي جاي من الفرونت (بتشيل الأدوار الفاضية والمكررة، وبترتبهم)
    // - ApplyToProperty(): بتخزن الـ JSON وبتملى أعمدة Ground/First/Second القديمة من نفس البيانات
    //   عشان الصفحات القديمة (الكروت، المقارنة، الأدمن) تفضل شغالة
    // - ToResponse(): بترجع الأدوار للفرونت، ولو الوحدة قديمة (من غير FloorsJson) بتبنيهم من الأعمدة القديمة
    public static class VillaFloorsHelper
    {
        public const int MinLevel = -1;   // Basement
        public const int MaxLevel = 20;
        private const int MaxCount = 99;

        private static readonly JsonSerializerOptions ReadOptions = new() { PropertyNameCaseInsensitive = true };
        private static readonly JsonSerializerOptions WriteOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

        public static List<VillaFloorDto> Parse(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return new List<VillaFloorDto>();

            try
            {
                var raw = JsonSerializer.Deserialize<List<VillaFloorDto>>(json, ReadOptions) ?? new List<VillaFloorDto>();

                return raw
                    .Where(f => f.Level >= MinLevel && f.Level <= MaxLevel)
                    .Select(f => new VillaFloorDto
                    {
                        Level = f.Level,
                        Rooms = Clamp(f.Rooms),
                        Baths = Clamp(f.Baths),
                        Reception = Clamp(f.Reception),
                        Kitchens = Clamp(f.Kitchens)
                    })
                    .Where(f => f.Rooms > 0 || f.Baths > 0 || f.Reception > 0 || f.Kitchens > 0)   // الأدوار اللي البروكر ملاها بس
                    .GroupBy(f => f.Level)
                    .Select(g => g.Last())                                       // لو دور اتكرر ناخد آخر واحد
                    .OrderBy(f => f.Level)
                    .ToList();
            }
            catch (JsonException)
            {
                return new List<VillaFloorDto>();
            }
        }

        // بترجع JSON نضيف جاهز للتخزين، أو null لو مفيش أي دور مملي
        public static string? Normalize(string? json)
        {
            var floors = Parse(json);
            return floors.Count == 0 ? null : JsonSerializer.Serialize(floors, WriteOptions);
        }

        // بتخزن الأدوار وبتملى أعمدة Ground/First/Second القديمة
        public static void ApplyToProperty(Property property, string? json)
        {
            var floors = Parse(json);

            property.FloorsJson = floors.Count == 0 ? null : JsonSerializer.Serialize(floors, WriteOptions);

            var ground = floors.FirstOrDefault(f => f.Level == 0);
            var first = floors.FirstOrDefault(f => f.Level == 1);
            var second = floors.FirstOrDefault(f => f.Level == 2);

            property.GroundRooms = ground?.Rooms ?? 0;
            property.GroundBaths = ground?.Baths ?? 0;
            property.GroundReception = ground?.Reception ?? 0;

            property.FirstRooms = first?.Rooms ?? 0;
            property.FirstBaths = first?.Baths ?? 0;
            property.FirstReception = first?.Reception ?? 0;

            property.SecondRooms = second?.Rooms ?? 0;
            property.SecondBaths = second?.Baths ?? 0;
            property.SecondReception = second?.Reception ?? 0;

            // 🟢 الفيلا مفيهاش خانة Kitchens عامة، فإجمالي المطابخ = مجموع مطابخ الأدوار (عشان الكروت والفلاتر والتفاصيل تفضل شغالة)
            property.Kitchens = floors.Sum(f => f.Kitchens);
        }

        // الأدوار اللي بترجع للفرونت
        public static List<VillaFloorDto> ToResponse(Property property)
        {
            if (!string.IsNullOrWhiteSpace(property.FloorsJson))
                return BackfillKitchens(Parse(property.FloorsJson), property.Kitchens);

            // وحدة قديمة اتسجلت قبل نظام الأدوار الديناميكي: بنبني الأدوار من الأعمدة القديمة
            var legacy = new List<VillaFloorDto>
            {
                new() { Level = 0, Rooms = property.GroundRooms ?? 0, Baths = property.GroundBaths ?? 0, Reception = property.GroundReception ?? 0 },
                new() { Level = 1, Rooms = property.FirstRooms ?? 0, Baths = property.FirstBaths ?? 0, Reception = property.FirstReception ?? 0 },
                new() { Level = 2, Rooms = property.SecondRooms ?? 0, Baths = property.SecondBaths ?? 0, Reception = property.SecondReception ?? 0 }
            };

            return BackfillKitchens(legacy.Where(f => f.Rooms > 0 || f.Baths > 0 || f.Reception > 0).ToList(), property.Kitchens);
        }

        // 🟢 الفيلات القديمة كان ليها عدد مطابخ واحد عام (Property.Kitchens) من غير تقسيم على الأدوار.
        // لو الأدوار مفيهاش مطابخ خالص، بننقل العدد القديم على الدور الأرضي عشان مايضيعش لما الفيلا تتعدل وتتحفظ.
        private static List<VillaFloorDto> BackfillKitchens(List<VillaFloorDto> floors, int legacyKitchens)
        {
            if (legacyKitchens <= 0 || floors.Any(f => f.Kitchens > 0)) return floors;

            var ground = floors.FirstOrDefault(f => f.Level == 0);
            if (ground == null)
            {
                ground = new VillaFloorDto { Level = 0 };
                floors.Add(ground);
            }
            ground.Kitchens = Clamp(legacyKitchens);

            return floors.OrderBy(f => f.Level).ToList();
        }

        // 🟢 الفيلا و Full Building ليهم نفس الخصائص (أدوار ديناميكية + مساحة أرض + حديقة)
        public static bool IsVillaLike(PropEnums.PropertyType type) =>
            type == PropEnums.PropertyType.Villa || type == PropEnums.PropertyType.FullBuilding;

        // للفيلا: كل الحسابات (السعر الكلي / سعر المتر / الفلاتر) بتتبني على مساحة الأرض (Land Area)،
        // فبنخزن المساحة الأساسية (Area) = مساحة الأرض مقربة لأقرب رقم صحيح
        public static void SyncAreaFromLand(Property property)
        {
            if (IsVillaLike(property.PropertyType) && property.LandArea.HasValue && property.LandArea.Value > 0)
            {
                property.Area = (int)Math.Round(property.LandArea.Value, MidpointRounding.AwayFromZero);
            }
        }

        private static int Clamp(int value) => Math.Min(Math.Max(value, 0), MaxCount);
    }
}