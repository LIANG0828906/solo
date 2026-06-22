export function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return [r, g, b];
}

function sRGBtoLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b);
}

export function calculateContrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
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
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

function adjustLuminanceToTarget(
  hex: string,
  bgLuminance: number,
  targetRatio: number,
  darken: boolean
): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s] = rgbToHsl(r, g, b);
  let low = 0;
  let high = 100;
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const [nr, ng, nb] = hslToRgb(h, s, mid);
    const l = relativeLuminance(nr, ng, nb);
    let ratio: number;
    if (darken) {
      ratio = (bgLuminance + 0.05) / (l + 0.05);
    } else {
      ratio = (l + 0.05) / (bgLuminance + 0.05);
    }
    if (ratio >= targetRatio) {
      if (darken) high = mid;
      else low = mid;
    } else {
      if (darken) low = mid;
      else high = mid;
    }
  }
  const newL = darken ? (low + high) / 2 : (low + high) / 2;
  const [nr, ng, nb] = hslToRgb(h, s, newL);
  return rgbToHex(nr, ng, nb);
}

export interface SuggestionResult {
  hex: string;
  description: string;
}

export function suggestAdjustedColor(
  fg: string,
  bg: string,
  targetRatio: number
): SuggestionResult {
  const [fr, fg2, fb] = hexToRgb(fg);
  const [br, bg2, bb] = hexToRgb(bg);
  const fgLum = relativeLuminance(fr, fg2, fb);
  const bgLum = relativeLuminance(br, bg2, bb);
  const [, , fgL] = rgbToHsl(fr, fg2, fb);
  const [, , bgL] = rgbToHsl(br, bg2, bb);
  const fgIsDarker = fgLum <= bgLum;
  const newHex = adjustLuminanceToTarget(fg, bgLum, targetRatio, fgIsDarker);
  const [nr, ng, nb] = hexToRgb(newHex);
  const [, , newL] = rgbToHsl(nr, ng, nb);
  const lDelta = Math.round(newL - fgL);
  if (fgIsDarker) {
    return {
      hex: newHex,
      description: `将前景色 HSL 中 L 通道从 ${fgL} 调整至 ${Math.round(newL)}（降低 ${Math.abs(lDelta)}%），或考虑将背景色亮度增加以提升对比度`,
    };
  } else {
    return {
      hex: newHex,
      description: `将前景色 HSL 中 L 通道从 ${fgL} 调整至 ${Math.round(newL)}（提高 ${Math.abs(lDelta)}%），或考虑将背景色亮度降低以提升对比度`,
    };
  }
}
