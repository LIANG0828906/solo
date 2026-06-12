export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      case bn:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  const hn = ((h % 360) + 360) % 360;
  const sn = Math.min(100, Math.max(0, s)) / 100;
  const ln = Math.min(100, Math.max(0, l)) / 100;

  if (sn === 0) {
    const v = Math.round(ln * 255);
    return rgbToHex(v, v, v);
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const t = hn / 360;

  const r = hue2rgb(p, q, t + 1 / 3);
  const g = hue2rgb(p, q, t);
  const b = hue2rgb(p, q, t - 1 / 3);

  return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

export function interpolateColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return rgbToHex(r, g, b);
}

export function createGradientCSS(
  type: 'linear' | 'radial',
  primary: string,
  secondary: string,
  angle: number
): string {
  if (type === 'linear') {
    return `linear-gradient(${angle}deg, ${primary}, ${secondary})`;
  }
  return `radial-gradient(circle, ${primary}, ${secondary})`;
}

export function adjustHue(hex: string, degrees: number): string {
  const hsl = hexToHsl(hex);
  hsl.h = (hsl.h + degrees) % 360;
  if (hsl.h < 0) hsl.h += 360;
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

export function adjustSaturation(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  hsl.s = Math.min(100, Math.max(0, hsl.s + amount));
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

export function adjustLightness(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  hsl.l = Math.min(100, Math.max(0, hsl.l + amount));
  return hslToHex(hsl.h, hsl.s, hsl.l);
}
