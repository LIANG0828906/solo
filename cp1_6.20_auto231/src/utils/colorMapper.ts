import type { ColorMap, LightDataPoint } from "../types";

export interface ColorStop {
  t: number;
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const bigint = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16
  );
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateColor(stops: ColorStop[], t: number): string {
  if (t <= stops[0].t) return rgbToHex(stops[0].r, stops[0].g, stops[0].b);
  if (t >= stops[stops.length - 1].t)
    return rgbToHex(
      stops[stops.length - 1].r,
      stops[stops.length - 1].g,
      stops[stops.length - 1].b
    );

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (t >= s1.t && t <= s2.t) {
      const range = s2.t - s1.t;
      const localT = range === 0 ? 0 : (t - s1.t) / range;
      return rgbToHex(
        lerp(s1.r, s2.r, localT),
        lerp(s1.g, s2.g, localT),
        lerp(s1.b, s2.b, localT)
      );
    }
  }
  return "#ffffff";
}

const COLOR_MAPS: Record<ColorMap, ColorStop[]> = {
  default: [
    { t: 0, ...hexToRgb("#4a148c") },
    { t: 0.33, ...hexToRgb("#7b1fa2") },
    { t: 0.66, ...hexToRgb("#00bcd4") },
    { t: 1, ...hexToRgb("#ffee58") },
  ],
  cool: [
    { t: 0, ...hexToRgb("#0d47a1") },
    { t: 0.5, ...hexToRgb("#26c6da") },
    { t: 1, ...hexToRgb("#e0f7fa") },
  ],
  warm: [
    { t: 0, ...hexToRgb("#311b92") },
    { t: 0.33, ...hexToRgb("#ef6c00") },
    { t: 0.66, ...hexToRgb("#ffd54f") },
    { t: 1, ...hexToRgb("#fff59d") },
  ],
  mono: [
    { t: 0, ...hexToRgb("#1a237e") },
    { t: 0.5, ...hexToRgb("#5c6bc0") },
    { t: 1, ...hexToRgb("#c5cae9") },
  ],
};

export function mapIntensityToColor(
  normalizedIntensity: number,
  colorMap: ColorMap = "default"
): string {
  const stops = COLOR_MAPS[colorMap] || COLOR_MAPS.default;
  return interpolateColor(stops, Math.max(0, Math.min(1, normalizedIntensity)));
}

export function classifyLevel(
  normalizedIntensity: number
): LightDataPoint["level"] {
  if (normalizedIntensity < 0.25) return "low";
  if (normalizedIntensity < 0.5) return "medium";
  if (normalizedIntensity < 0.75) return "high";
  return "extreme";
}

export function hexToThreeColor(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}
