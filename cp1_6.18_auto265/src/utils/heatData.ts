export const ZONE_COLORS = {
  traffic: '#00E5FF',
  commercial: '#FFD700',
  residential: '#FF6B6B',
  cultural: '#C084FC',
} as const;

export type ZoneType = keyof typeof ZONE_COLORS;

export const ZONE_LABELS: Record<ZoneType, string> = {
  traffic: '交通区',
  commercial: '商业区',
  residential: '居住区',
  cultural: '文化区',
};

export interface Building {
  id: number;
  height: number;
  zoneType: ZoneType;
  baseX: number;
}

const ZONE_TYPES: ZoneType[] = ['traffic', 'commercial', 'residential', 'cultural'];

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateBuildings(count: number = 12): Building[] {
  const rand = seededRandom(20250618);
  const buildings: Building[] = [];
  for (let i = 0; i < count; i++) {
    buildings.push({
      id: i,
      height: 20 + Math.floor(rand() * 101),
      zoneType: ZONE_TYPES[Math.floor(rand() * ZONE_TYPES.length)],
      baseX: i,
    });
  }
  return buildings;
}

function sineAtHour(minuteOfDay: number, peakHour: number, widthHours: number = 6, baseline: number = 10): number {
  const hour = minuteOfDay / 60;
  const shift = (hour - peakHour + 24) % 24;
  const x = (shift < 12 ? shift : 24 - shift) / (widthHours / 2);
  const val = Math.cos(Math.PI * Math.min(1, Math.max(0, x / 2)));
  return baseline + (val * 0.5 + 0.5) * (100 - baseline);
}

function bimodalSine(minuteOfDay: number, peak1: number, peak2: number, width: number = 5, baseline: number = 10): number {
  return Math.max(
    sineAtHour(minuteOfDay, peak1, width, baseline),
    sineAtHour(minuteOfDay, peak2, width, baseline)
  );
}

export function computeHotness(minuteOfDay: number): Record<ZoneType, number> {
  const clamped = ((minuteOfDay % 1440) + 1440) % 1440;
  const noise = mulberry32(Math.floor(clamped / 5) + 1);
  const base: Record<ZoneType, number> = {
    traffic: bimodalSine(clamped, 8, 18, 4),
    commercial: sineAtHour(clamped, 14, 8),
    residential: bimodalSine(clamped, 7, 22, 5),
    cultural: sineAtHour(clamped, 20, 6),
  };
  const result = {} as Record<ZoneType, number>;
  (Object.keys(base) as ZoneType[]).forEach((z) => {
    const n = (noise() - 0.5) * 10;
    result[z] = Math.max(0, Math.min(100, Math.round(base[z] + n)));
  });
  return result;
}

export function generateWindowGrid(seed: number, density: number): boolean[][] {
  const rand = mulberry32(seed);
  const rows = 5;
  const cols = 3;
  const grid: boolean[][] = [];
  const threshold = 1 - density / 100;
  for (let r = 0; r < rows; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(rand() > threshold);
    }
    grid.push(row);
  }
  return grid;
}

export function formatTime(minuteOfDay: number): string {
  const clamped = Math.floor(((minuteOfDay % 1440) + 1440) % 1440);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getCurrentMinuteOfDay(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function averageHotness(hotness: Record<ZoneType, number>): number {
  const vals = Object.values(hotness);
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}
