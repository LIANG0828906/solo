import { Hsluv } from 'hsluv';
import type { HSLColor, RGBColor } from '../types/color';

export const hslToRgb = (hsl: HSLColor): RGBColor => {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
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
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

export const rgbToHsl = (rgb: RGBColor): HSLColor => {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

export const hslToHex = (hsl: HSLColor): string => {
  const rgb = hslToRgb(hsl);
  return rgbToHex(rgb);
};

export const rgbToHex = (rgb: RGBColor): string => {
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

export const hexToHsl = (hex: string): HSLColor => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { h: 0, s: 0, l: 0 };
  }
  const rgb = {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
  return rgbToHsl(rgb);
};

export const hslToHsluv = (hsl: HSLColor): [number, number, number] => {
  return [hsl.h, hsl.s, hsl.l];
};

export const hsluvToHsl = (h: number, s: number, l: number): HSLColor => {
  return { h, s, l };
};

export const getPerceptuallyUniformGradient = (colors: HSLColor[], steps: number): HSLColor[] => {
  if (colors.length === 0) return [];
  if (colors.length === 1) return Array(steps).fill(colors[0]);
  if (steps === 1) return [colors[0]];

  const result: HSLColor[] = [];
  const segments = colors.length - 1;
  const stepsPerSegment = Math.max(1, Math.floor((steps - 1) / segments));

  for (let i = 0; i < segments; i++) {
    const start = colors[i];
    const end = colors[i + 1];
    const segSteps = i === segments - 1 ? steps - result.length : stepsPerSegment + 1;

    for (let j = 0; j < segSteps; j++) {
      const t = segSteps === 1 ? 0 : j / (segSteps - 1);
      result.push(lerpHsluv(start, end, t));
    }
  }

  return result.slice(0, steps);
};

export const lerpHsluv = (a: HSLColor, b: HSLColor, t: number): HSLColor => {
  const convA = new Hsluv();
  convA.hsluv_h = a.h;
  convA.hsluv_s = a.s;
  convA.hsluv_l = a.l;
  convA.hsluvToRgb();

  const convB = new Hsluv();
  convB.hsluv_h = b.h;
  convB.hsluv_s = b.s;
  convB.hsluv_l = b.l;
  convB.hsluvToRgb();

  const r = convA.rgb_r + (convB.rgb_r - convA.rgb_r) * t;
  const g = convA.rgb_g + (convB.rgb_g - convA.rgb_g) * t;
  const bl = convA.rgb_b + (convB.rgb_b - convA.rgb_b) * t;

  const convResult = new Hsluv();
  convResult.rgb_r = r;
  convResult.rgb_g = g;
  convResult.rgb_b = bl;
  convResult.rgbToHsluv();

  return {
    h: Math.round(convResult.hsluv_h),
    s: Math.round(convResult.hsluv_s),
    l: Math.round(convResult.hsluv_l),
  };
};

export const lerpHsl = (a: HSLColor, b: HSLColor, t: number): HSLColor => {
  let hDiff = b.h - a.h;
  if (Math.abs(hDiff) > 180) {
    hDiff = hDiff > 0 ? hDiff - 360 : hDiff + 360;
  }

  return {
    h: ((a.h + hDiff * t) % 360 + 360) % 360,
    s: a.s + (b.s - a.s) * t,
    l: a.l + (b.l - a.l) * t,
  };
};

export const getRelativeLuminance = (rgb: RGBColor): number => {
  const sRGB = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(v =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
};

export const getContrastColor = (hsl: HSLColor): string => {
  const rgb = hslToRgb(hsl);
  const luminance = getRelativeLuminance(rgb);
  return luminance > 0.179 ? '#000000' : '#ffffff';
};

export const clampHsl = (hsl: HSLColor): HSLColor => ({
  h: Math.max(0, Math.min(360, hsl.h)),
  s: Math.max(0, Math.min(100, hsl.s)),
  l: Math.max(0, Math.min(100, hsl.l)),
});

export const hslToString = (hsl: HSLColor): string => {
  return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
};

export const hsluvStringToHsl = (h: number, s: number, l: number): HSLColor => {
  const conv = new Hsluv();
  conv.hsluv_h = h;
  conv.hsluv_s = s;
  conv.hsluv_l = l;
  conv.hsluvToRgb();
  return rgbToHsl({
    r: Math.round(conv.rgb_r * 255),
    g: Math.round(conv.rgb_g * 255),
    b: Math.round(conv.rgb_b * 255),
  });
};
