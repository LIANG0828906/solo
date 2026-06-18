export interface FlavorTagLike {
  name: string;
  color: string;
}

export interface RecordLike {
  rating: number;
  flavorTags: FlavorTagLike[];
  createdAt: Date | string;
}

export interface RadarPoint {
  flavor: string;
  intensity: number;
  color?: string;
}

interface FlavorStat {
  name: string;
  color: string;
  frequency: number;
  totalRating: number;
  count: number;
}

export const FLAVOR_ORDER = ['花香', '果酸', '巧克力', '坚果', '焦糖', '烟熏', '草本', '酒香'];

export function analyzeFlavorProfile(records: RecordLike[]): RadarPoint[] {
  if (!records || records.length === 0) {
    return FLAVOR_ORDER.slice(0, 5).map((flavor) => ({
      flavor,
      intensity: 0,
    }));
  }

  const statsMap = new Map<string, FlavorStat>();

  for (const record of records) {
    for (const tag of record.flavorTags) {
      const existing = statsMap.get(tag.name);
      if (existing) {
        existing.frequency += 1;
        existing.totalRating += record.rating;
        existing.count += 1;
      } else {
        statsMap.set(tag.name, {
          name: tag.name,
          color: tag.color,
          frequency: 1,
          totalRating: record.rating,
          count: 1,
        });
      }
    }
  }

  const stats = Array.from(statsMap.values());

  if (stats.length === 0) {
    return FLAVOR_ORDER.slice(0, 5).map((flavor) => ({ flavor, intensity: 0 }));
  }

  const withScore = stats.map((s) => ({
    ...s,
    avgRating: s.totalRating / s.count,
    rawScore: s.frequency * (s.totalRating / s.count),
  }));

  const maxScore = Math.max(...withScore.map((s) => s.rawScore));

  const normalized = withScore
    .map((s) => ({
      flavor: s.name,
      color: s.color,
      intensity: maxScore > 0 ? Math.round((s.rawScore / maxScore) * 100) : 0,
    }))
    .sort((a, b) => b.intensity - a.intensity);

  const top5 = normalized.slice(0, 5);

  if (top5.length < 5) {
    const used = new Set(top5.map((t) => t.flavor));
    for (const flavor of FLAVOR_ORDER) {
      if (top5.length >= 5) break;
      if (!used.has(flavor)) {
        top5.push({ flavor, intensity: 0 });
      }
    }
  }

  return top5;
}

export interface TrendPoint {
  date: string;
  rating: number;
}

export function getFlavorTrend(records: RecordLike[], flavorName: string): TrendPoint[] {
  return records
    .filter((r) => r.flavorTags.some((t) => t.name === flavorName))
    .map((r) => ({
      date: new Date(r.createdAt).toISOString().split('T')[0],
      rating: r.rating,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getAverageColor(flavorTags: FlavorTagLike[]): string {
  if (!flavorTags || flavorTags.length === 0) {
    return '#16213E';
  }
  return flavorTags[0].color;
}

export function hexToRgb(hex: string, alpha: number = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function mixColors(colors: string[]): string {
  if (colors.length === 0) return '#16213E';
  if (colors.length === 1) return colors[0];

  let r = 0, g = 0, b = 0;
  for (const c of colors) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c);
    if (result) {
      r += parseInt(result[1], 16);
      g += parseInt(result[2], 16);
      b += parseInt(result[3], 16);
    }
  }
  r = Math.round(r / colors.length);
  g = Math.round(g / colors.length);
  b = Math.round(b / colors.length);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function buildTagFrequencyMap(records: RecordLike[]): Map<string, { count: number; color: string }> {
  const map = new Map<string, { count: number; color: string }>();
  for (const record of records) {
    for (const tag of record.flavorTags) {
      const existing = map.get(tag.name);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(tag.name, { count: 1, color: tag.color });
      }
    }
  }
  return map;
}
