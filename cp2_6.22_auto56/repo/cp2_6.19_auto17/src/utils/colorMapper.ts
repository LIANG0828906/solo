export interface EmotionValues {
  happy: number;
  sad: number;
  angry: number;
  calm: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

const EMOTION_COLORS: Record<keyof EmotionValues, HSL> = {
  happy: { h: 50, s: 100, l: 60 },
  sad: { h: 220, s: 70, l: 50 },
  angry: { h: 0, s: 85, l: 55 },
  calm: { h: 160, s: 60, l: 65 },
};

export function emotionToColor(emotion: keyof EmotionValues, intensity: number): HSL {
  const base = EMOTION_COLORS[emotion];
  return {
    h: base.h,
    s: Math.min(100, base.s * intensity),
    l: Math.min(100, Math.max(0, base.l * (0.5 + intensity * 0.5))),
  };
}

export function hslToString(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

export function hslToRgb(hsl: HSL): RGB {
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
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

export function hslToHsv(hsl: HSL): HSV {
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  const v = l + s * Math.min(l, 1 - l);
  const sV = v === 0 ? 0 : 2 * (1 - l / v);
  return {
    h: hsl.h,
    s: sV * 100,
    v: v * 100,
  };
}

export function hsvToHsl(hsv: HSV): HSL {
  const s = hsv.s / 100;
  const v = hsv.v / 100;
  const l = v * (1 - s / 2);
  const sL = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
  return {
    h: hsv.h,
    s: sL * 100,
    l: l * 100,
  };
}

export function mixEmotionColors(emotions: EmotionValues): HSL {
  const total = emotions.happy + emotions.sad + emotions.angry + emotions.calm;
  if (total === 0) {
    return { h: 0, s: 0, l: 75 };
  }

  const keys: (keyof EmotionValues)[] = ['happy', 'sad', 'angry', 'calm'];
  let hSin = 0;
  let hCos = 0;
  let sSum = 0;
  let lSum = 0;

  for (const key of keys) {
    const intensity = emotions[key];
    const weight = intensity / total;
    const color = emotionToColor(key, intensity);
    const rad = (color.h * Math.PI) / 180;
    hSin += Math.sin(rad) * weight;
    hCos += Math.cos(rad) * weight;
    sSum += color.s * weight;
    lSum += color.l * weight;
  }

  const hRad = Math.atan2(hSin, hCos);
  let h = (hRad * 180) / Math.PI;
  if (h < 0) h += 360;

  return {
    h: Math.round(h),
    s: Math.round(sSum),
    l: Math.round(lSum),
  };
}

export function getGradientColors(emotions: EmotionValues): HSL[] {
  const keys: (keyof EmotionValues)[] = ['happy', 'sad', 'angry', 'calm'];
  const colors: HSL[] = [];
  
  for (const key of keys) {
    if (emotions[key] > 0.01) {
      colors.push(emotionToColor(key, emotions[key]));
    }
  }
  
  if (colors.length === 0) {
    colors.push({ h: 0, s: 0, l: 85 });
    colors.push({ h: 0, s: 0, l: 70 });
  } else if (colors.length === 1) {
    const c = colors[0];
    colors.push({ h: c.h, s: Math.max(0, c.s - 20), l: Math.min(100, c.l + 15) });
  }
  
  return colors;
}

export function extractHsvKeyColors(mixedColor: HSL): { hKey: HSV; sKey: HSV; vKey: HSV } {
  const hsv = hslToHsv(mixedColor);
  
  const hKey: HSV = { h: hsv.h, s: 100, v: 100 };
  const sKey: HSV = { h: hsv.h, s: hsv.s, v: 100 };
  const vKey: HSV = { h: hsv.h, s: 30, v: hsv.v };
  
  return { hKey, sKey, vKey };
}

export function hsvToString(hsv: HSV): string {
  const hsl = hsvToHsl(hsv);
  return hslToString(hsl);
}

export function hsvToHex(hsv: HSV): string {
  return hslToHex(hsvToHsl(hsv));
}
