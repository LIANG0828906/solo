export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface ColorSchemes {
  monochromatic: string[];
  analogous: string[];
  complementary: string[];
  triadic: string[];
  tetradic: string[];
}

export type GradientType = 'linear' | 'radial' | 'conic';

export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  ).toUpperCase();
}

export function hexToHsl(hex: string): HSL {
  const { r, g, b } = hexToRgb(hex);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const hNorm = ((h % 360) + 360) % 360 / 360;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;

  if (sNorm === 0) {
    const val = Math.round(lNorm * 255);
    return rgbToHex(val, val, val);
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;

  const r = hue2rgb(p, q, hNorm + 1 / 3);
  const g = hue2rgb(p, q, hNorm);
  const b = hue2rgb(p, q, hNorm - 1 / 3);

  return rgbToHex(r * 255, g * 255, b * 255);
}

export function getComplementaryColor(hex: string): string {
  const hsl = hexToHsl(hex);
  return hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
}

export function generateLinearGradient(
  color1: string,
  color2: string,
  angle: number
): string {
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
}

export function generateRadialGradient(
  color1: string,
  color2: string
): string {
  return `radial-gradient(circle, ${color1}, ${color2})`;
}

export function generateConicGradient(
  color1: string,
  color2: string,
  angle: number
): string {
  return `conic-gradient(from ${angle}deg, ${color1}, ${color2}, ${color1})`;
}

export function generateGradient(
  type: GradientType,
  color1: string,
  color2: string,
  angle: number
): string {
  switch (type) {
    case 'radial':
      return generateRadialGradient(color1, color2);
    case 'conic':
      return generateConicGradient(color1, color2, angle);
    case 'linear':
    default:
      return generateLinearGradient(color1, color2, angle);
  }
}

export function generateColorSchemes(primaryHex: string): ColorSchemes {
  const hsl = hexToHsl(primaryHex);
  const { h, s, l } = hsl;

  const monochromatic: string[] = [
    hslToHex(h, s, Math.max(10, l - 30)),
    hslToHex(h, s, Math.max(20, l - 15)),
    primaryHex,
    hslToHex(h, s, Math.min(90, l + 15)),
    hslToHex(h, s, Math.min(95, l + 30)),
  ];

  const analogous: string[] = [
    hslToHex((h - 30 + 360) % 360, s, l),
    hslToHex((h - 15 + 360) % 360, s, l),
    primaryHex,
    hslToHex((h + 15) % 360, s, l),
    hslToHex((h + 30) % 360, s, l),
  ];

  const complementary: string[] = [
    hslToHex((h - 15 + 360) % 360, s, l),
    primaryHex,
    hslToHex(h, Math.max(30, s - 20), Math.min(80, l + 10)),
    hslToHex((h + 180) % 360, s, l),
    hslToHex((h + 180 + 15) % 360, s, l),
  ];

  const triadic: string[] = [
    primaryHex,
    hslToHex((h + 15) % 360, s, Math.min(85, l + 10)),
    hslToHex((h + 120) % 360, s, l),
    hslToHex((h + 120 + 15) % 360, s, Math.min(85, l + 10)),
    hslToHex((h + 240) % 360, s, l),
  ];

  const tetradic: string[] = [
    primaryHex,
    hslToHex((h + 90) % 360, s, l),
    hslToHex((h + 180) % 360, s, l),
    hslToHex((h + 270) % 360, s, l),
    hslToHex(h, Math.max(40, s - 15), Math.min(75, l + 15)),
  ];

  return {
    monochromatic,
    analogous,
    complementary,
    triadic,
    tetradic,
  };
}
