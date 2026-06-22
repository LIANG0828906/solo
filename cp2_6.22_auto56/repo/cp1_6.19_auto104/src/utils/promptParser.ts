export interface ParticleParams {
  count: number;
  sizeRange: [number, number];
  speedRange: [number, number];
  opacityRange: [number, number];
}

export interface ShapeParams {
  count: number;
  types: ('circle' | 'wave' | 'rect')[];
}

export interface ParsedPrompt {
  colors: string[];
  particles: ParticleParams;
  shapes: ShapeParams;
  motionIntensity: number;
  density: number;
}

const colorThemes: Record<string, string[]> = {
  moonlight: ['#E8E8E8', '#B8C5D6', '#6B7FD7', '#4A5568', '#2D3748'],
  autumn: ['#D4A574', '#C17F59', '#8B4513', '#5D4037', '#2E7D32'],
  ocean: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#03045E'],
  sunset: ['#FF6B6B', '#FFA07A', '#FFD93D', '#E94560', '#6B5B95'],
  forest: ['#2D5A27', '#52B788', '#95D5B2', '#40916C', '#1B4332'],
  night: ['#1A1A2E', '#16213E', '#0F3460', '#533483', '#E94560'],
  spring: ['#FFB7C5', '#FF69B4', '#98FB98', '#87CEEB', '#DDA0DD'],
  desert: ['#EDC9AF', '#D2691E', '#F4A460', '#CD853F', '#8B4513'],
  storm: ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#E74C3C'],
  candy: ['#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD', '#FFD700'],
};

const keywordMappings: { keywords: string[]; theme: keyof typeof colorThemes; intensity: number }[] = [
  { keywords: ['月光', '月亮', '月', 'silver', 'moon', 'lunar'], theme: 'moonlight', intensity: 0.3 },
  { keywords: ['秋', '落叶', '枫叶', 'autumn', 'fall', 'leaf'], theme: 'autumn', intensity: 0.5 },
  { keywords: ['海', '洋', '浪', 'ocean', 'sea', 'wave', 'blue'], theme: 'ocean', intensity: 0.6 },
  { keywords: ['夕阳', '日落', '晚霞', 'sunset', 'dusk', 'evening'], theme: 'sunset', intensity: 0.7 },
  { keywords: ['森', '林', '树', 'forest', 'tree', 'green', 'nature'], theme: 'forest', intensity: 0.4 },
  { keywords: ['夜', '晚', '星空', 'night', 'dark', 'star'], theme: 'night', intensity: 0.3 },
  { keywords: ['春', '花', '粉', 'spring', 'flower', 'pink'], theme: 'spring', intensity: 0.8 },
  { keywords: ['沙', '漠', '黄', 'desert', 'sand', 'gold'], theme: 'desert', intensity: 0.5 },
  { keywords: ['风暴', '雨', '雷', 'storm', 'rain', 'thunder'], theme: 'storm', intensity: 0.9 },
  { keywords: ['糖', '甜', '彩虹', 'candy', 'sweet', 'rainbow'], theme: 'candy', intensity: 0.8 },
  { keywords: ['风', 'wind', 'breeze'], theme: 'ocean', intensity: 0.6 },
  { keywords: ['火', '焰', 'flame', 'fire'], theme: 'sunset', intensity: 0.85 },
  { keywords: ['雪', '冰', 'snow', 'ice', 'winter'], theme: 'moonlight', intensity: 0.4 },
  { keywords: ['涟漪', '波纹', 'ripple', 'water'], theme: 'ocean', intensity: 0.5 },
  { keywords: ['呢喃', '耳语', 'whisper'], theme: 'spring', intensity: 0.3 },
  { keywords: ['诗', 'poem', 'poetry'], theme: 'night', intensity: 0.4 },
  { keywords: ['梦', 'dream', 'fantasy'], theme: 'candy', intensity: 0.5 },
];

export function parsePrompt(prompt: string): ParsedPrompt {
  const lowerPrompt = prompt.toLowerCase();
  let matchedTheme: keyof typeof colorThemes = 'night';
  let totalIntensity = 0;
  let matchCount = 0;

  for (const mapping of keywordMappings) {
    if (mapping.keywords.some(kw => lowerPrompt.includes(kw.toLowerCase()))) {
      matchedTheme = mapping.theme;
      totalIntensity += mapping.intensity;
      matchCount++;
    }
  }

  const motionIntensity = matchCount > 0 ? totalIntensity / matchCount : 0.5;
  const lengthFactor = Math.min(prompt.length / 30, 1);
  const density = 0.5 + lengthFactor * 0.3 + motionIntensity * 0.2;

  const baseParticleCount = Math.floor(300 + density * 200);
  const particleCount = Math.min(baseParticleCount, 500);

  const colors = colorThemes[matchedTheme];

  return {
    colors,
    particles: {
      count: particleCount,
      sizeRange: [2, 6 + motionIntensity * 4],
      speedRange: [0.5, 1 + motionIntensity * 1],
      opacityRange: [0.3, 0.7 + motionIntensity * 0.3],
    },
    shapes: {
      count: Math.floor(5 + density * 10),
      types: ['circle', 'wave', 'rect'],
    },
    motionIntensity,
    density,
  };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
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
      .map(x => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  v /= 100;

  let r = 0,
    g = 0,
    b = 0;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const rgb = hexToRgb(hex);
  return rgbToHsv(rgb.r, rgb.g, rgb.b);
}

export function hsvToHex(h: number, s: number, v: number): string {
  const rgb = hsvToRgb(h, s, v);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

export function generateColorVariants(baseColors: string[], count: number): string[][] {
  const variants: string[][] = [];

  for (let i = 0; i < count; i++) {
    const hueShift = (i * 360) / count + Math.random() * 30 - 15;
    const saturationShift = Math.random() * 20 - 10;
    const valueShift = Math.random() * 15 - 7;

    const variant = baseColors.map(color => {
      const hsv = hexToHsv(color);
      const newH = (hsv.h + hueShift + 360) % 360;
      const newS = Math.max(0, Math.min(100, hsv.s + saturationShift));
      const newV = Math.max(0, Math.min(100, hsv.v + valueShift));
      return hsvToHex(newH, newS, newV);
    });

    variants.push(variant);
  }

  return variants;
}
