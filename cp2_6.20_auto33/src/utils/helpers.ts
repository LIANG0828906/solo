export function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, v));
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function randRange(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

export function levelBadgeColor(level: number): { fill: string; stroke: string; shine: string } {
  if (level <= 3) {
    return { fill: '#CD7F32', stroke: '#8B4513', shine: '#E8B880' };
  } else if (level <= 6) {
    return { fill: '#C0C0C0', stroke: '#808080', shine: '#EAEAEA' };
  } else {
    return { fill: '#FFD700', stroke: '#DAA520', shine: '#FFF176' };
  }
}

export function expForLevel(level: number): number {
  const TABLE = [0, 50, 120, 220, 350, 520, 730, 980, 1280, 1630, 2030];
  return TABLE[Math.min(level, TABLE.length - 1)];
}

export function expProgress(level: number, exp: number): number {
  const current = expForLevel(level);
  const next = expForLevel(Math.min(level + 1, 10));
  if (level >= 10) return 1;
  const span = Math.max(1, next - current);
  return clamp((exp - current) / span, 0, 1);
}

export function breedDisplayName(species: string, breed: string): string {
  const map: Record<string, Record<string, string>> = {
    cat: { domestic: '普通家猫', scottish: '苏格兰折耳', ragdoll: '布偶猫' },
    dog: { shiba: '柴犬', golden: '金毛', corgi: '柯基' }
  };
  return map[species]?.[breed] ?? breed;
}
