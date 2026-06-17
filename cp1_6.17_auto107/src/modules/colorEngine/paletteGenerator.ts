import type { HSLColor } from './colorSpace';

const BASE_COLORS: HSLColor[] = [
  { h: 0, s: 70, l: 50 },
  { h: 25, s: 80, l: 55 },
  { h: 45, s: 85, l: 55 },
  { h: 60, s: 70, l: 50 },
  { h: 90, s: 60, l: 45 },
  { h: 120, s: 55, l: 40 },
  { h: 150, s: 60, l: 45 },
  { h: 175, s: 65, l: 45 },
  { h: 200, s: 70, l: 50 },
  { h: 220, s: 65, l: 50 },
  { h: 250, s: 60, l: 55 },
  { h: 275, s: 55, l: 50 },
  { h: 300, s: 60, l: 50 },
  { h: 325, s: 65, l: 55 },
  { h: 350, s: 70, l: 50 },
  { h: 15, s: 75, l: 50 },
];

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };
}

function getDateSeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

export function generateDailyPalette(): HSLColor[] {
  const seed = getDateSeed();
  const rng = seededRandom(seed);
  const indices: number[] = [];
  const available = Array.from({ length: 16 }, (_, i) => i);
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(rng() * available.length);
    indices.push(available[idx]);
    available.splice(idx, 1);
  }
  return indices.map(i => {
    const base = BASE_COLORS[i];
    const hJitter = (rng() - 0.5) * 20;
    const sJitter = (rng() - 0.5) * 10;
    const lJitter = (rng() - 0.5) * 10;
    return {
      h: ((base.h + hJitter) % 360 + 360) % 360,
      s: Math.max(20, Math.min(100, base.s + sJitter)),
      l: Math.max(20, Math.min(80, base.l + lJitter)),
    };
  });
}
