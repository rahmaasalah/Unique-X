// 🟢 أدوار الفيلا الديناميكية (Basement / Ground / First / Second / Third ...)
// level: -1 = Basement, 0 = Ground, 1 = First, 2 = Second, 3 = Third ... وهكذا

export interface VillaFloor {
  level: number;
  rooms: number;
  baths: number;
  reception: number;
  kitchens: number;
}

// أقل دور (Basement) وأعلى دور مسموح بإضافته من زرار +
export const MIN_FLOOR_LEVEL = -1;
export const MAX_FLOOR_LEVEL = 10;

const ORDINALS = [
  'Ground', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth',
  'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth'
];

// اسم الدور بدون كلمة Floor: Basement / Ground / First / Second ...
export function floorLabel(level: number): string {
  if (level < 0) return 'Basement';
  return ORDINALS[level] ?? `Level ${level}`;
}

function toNumber(value: any): number {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

// بترجع الأدوار اللي البروكر ملاها بس (مرتبة من الأسفل للأعلى)
// - لو الوحدة جاية بـ floors (النظام الجديد) بنستخدمها
// - لو وحدة قديمة بنبني الأدوار من أعمدة Ground / First / Second القديمة
export function villaFloorsOf(p: any): VillaFloor[] {
  if (!p) return [];

  let floors: VillaFloor[] = [];

  if (Array.isArray(p.floors) && p.floors.length > 0) {
    floors = p.floors.map((f: any) => ({
      level: toNumber(f.level),
      rooms: toNumber(f.rooms),
      baths: toNumber(f.baths),
      reception: toNumber(f.reception),
      kitchens: toNumber(f.kitchens)
    }));
  } else {
    floors = [
      { level: 0, rooms: toNumber(p.groundRooms), baths: toNumber(p.groundBaths), reception: toNumber(p.groundReception), kitchens: 0 },
      { level: 1, rooms: toNumber(p.firstRooms), baths: toNumber(p.firstBaths), reception: toNumber(p.firstReception), kitchens: 0 },
      { level: 2, rooms: toNumber(p.secondRooms), baths: toNumber(p.secondBaths), reception: toNumber(p.secondReception), kitchens: 0 }
    ];
  }

  return floors
    .filter(f => f.rooms > 0 || f.baths > 0 || f.reception > 0 || f.kitchens > 0)
    .sort((a, b) => a.level - b.level);
}

// مجموع الغرف والحمامات في كل أدوار الفيلا (للكروت وصفحة المقارنة)
export function villaTotals(p: any): { rooms: number; baths: number } {
  return villaFloorsOf(p).reduce(
    (acc, f) => ({ rooms: acc.rooms + f.rooms, baths: acc.baths + f.baths }),
    { rooms: 0, baths: 0 }
  );
}

// 🟢 الفيلا و Full Building ليهم نفس الخصائص (أدوار ديناميكية + مساحة أرض + حديقة)
// بتقبل الاسم (من الـ API: 'Villa' / 'FullBuilding') أو الرقم (من الفورم: 1 / 6)
export function isVillaLike(type: any): boolean {
  return type === 'Villa' || type === 'FullBuilding' || Number(type) === 1 || Number(type) === 6;
}