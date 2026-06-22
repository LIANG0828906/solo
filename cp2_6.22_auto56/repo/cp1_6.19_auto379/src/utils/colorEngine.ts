export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface ColorPair {
  primary: HSL;
  secondary: HSL;
}

const PRESET_COLORS: HSL[] = [
  { h: 0, s: 100, l: 71 },
  { h: 25, s: 100, l: 63 },
  { h: 45, s: 99, l: 68 },
  { h: 195, s: 96, l: 64 },
  { h: 197, s: 89, l: 47 },
  { h: 243, s: 98, l: 80 },
];

const TRANSITION_DURATION = 1.5;
const STAGE_COUNT = PRESET_COLORS.length;

function hexToHsl(hex: string): HSL {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function sinInterpolation(t: number): number {
  return (1 - Math.cos(t * Math.PI)) / 2;
}

function interpolateHSL(a: HSL, b: HSL, t: number): HSL {
  const ease = sinInterpolation(t);
  return {
    h: a.h + (b.h - a.h) * ease,
    s: a.s + (b.s - a.s) * ease,
    l: a.l + (b.l - a.l) * ease,
  };
}

function hslToString(c: HSL, alpha: number = 1): string {
  return `hsla(${c.h.toFixed(1)}, ${c.s.toFixed(1)}%, ${c.l.toFixed(1)}%, ${alpha})`;
}

function getSecondary(primary: HSL): HSL {
  return {
    h: (primary.h + 180) % 360,
    s: Math.min(primary.s + 10, 100),
    l: Math.min(primary.l + 8, 95),
  };
}

export function getScrollBasedColor(scrollY: number, viewportHeight: number, totalHeight: number): ColorPair {
  const maxScroll = Math.max(totalHeight - viewportHeight, 1);
  const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
  const totalStages = STAGE_COUNT;
  const rawPosition = progress * (totalStages - 1);
  const stageIndex = Math.floor(rawPosition);
  const stageProgress = rawPosition - stageIndex;
  const current = PRESET_COLORS[stageIndex];
  const next = PRESET_COLORS[Math.min(stageIndex + 1, totalStages - 1)];
  const primary = interpolateHSL(current, next, stageProgress);
  return { primary, secondary: getSecondary(primary) };
}

export function getTimeBasedColor(timeOffset: number): ColorPair {
  const cycleProgress = ((timeOffset / 1000) % TRANSITION_DURATION) / TRANSITION_DURATION;
  const stageIndex = Math.floor((timeOffset / 1000 / TRANSITION_DURATION) % STAGE_COUNT);
  const nextIndex = (stageIndex + 1) % STAGE_COUNT;
  const current = PRESET_COLORS[stageIndex];
  const next = PRESET_COLORS[nextIndex];
  const primary = interpolateHSL(current, next, cycleProgress);
  return { primary, secondary: getSecondary(primary) };
}

export function brightenHSL(c: HSL, amount: number = 15): HSL {
  return {
    h: c.h,
    s: c.s,
    l: Math.min(c.l + amount, 95),
  };
}

export function hslToHexString(c: HSL): string {
  const h = c.h / 360;
  const s = c.s / 100;
  const l = c.l / 100;
  if (s === 0) {
    const gray = Math.round(l * 255);
    return `#${gray.toString(16).padStart(2, '0').repeat(3)}`;
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export { hslToString, PRESET_COLORS, hexToHsl };
