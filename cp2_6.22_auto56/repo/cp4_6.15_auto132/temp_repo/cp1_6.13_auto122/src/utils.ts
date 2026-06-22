export interface ColorStop {
  id: string;
  position: number;
  color: string;
}

export interface Preset {
  id: string;
  name: string;
  stops: ColorStop[];
}

export interface CollectionItem {
  id: string;
  name: string;
  stops: ColorStop[];
  createdAt: number;
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
  return '#' + [r, g, b].map((x) => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
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

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
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

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

export function generateGradientString(stops: ColorStop[]): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  return `linear-gradient(to right, ${sorted.map((s) => `${s.color} ${s.position}%`).join(', ')})`;
}

export function generateCssCode(stops: ColorStop[]): string {
  const gradient = generateGradientString(stops);
  const colorList = stops
    .sort((a, b) => a.position - b.position)
    .map((s, i) => `  --color-${i + 1}: ${s.color}; /* position: ${s.position}% */`)
    .join('\n');
  
  return `/* ColorScape Gradient Palette */
:root {
${colorList}
  --gradient: ${gradient};
}

.gradient-bg {
  background: var(--gradient);
}

.gradient-text {
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Full color values */
${stops.sort((a, b) => a.position - b.position).map((s, i) => `/* Color ${i + 1}: ${s.color} (${s.position}%) */`).join('\n')}
`;
}

export function interpolateColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return rgbToHex(
    c1.r + (c2.r - c1.r) * t,
    c1.g + (c2.g - c1.g) * t,
    c1.b + (c2.b - c1.b) * t,
  );
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export const presets: Preset[] = [
  {
    id: 'sunset',
    name: '日落',
    stops: [
      { id: 's1', position: 0, color: '#ff6b6b' },
      { id: 's2', position: 35, color: '#feca57' },
      { id: 's3', position: 70, color: '#ff9ff3' },
      { id: 's4', position: 100, color: '#54a0ff' },
    ],
  },
  {
    id: 'aurora',
    name: '极光',
    stops: [
      { id: 'a1', position: 0, color: '#00d2d3' },
      { id: 'a2', position: 30, color: '#5f27cd' },
      { id: 'a3', position: 60, color: '#ff9ff3' },
      { id: 'a4', position: 100, color: '#48dbfb' },
    ],
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    stops: [
      { id: 'c1', position: 0, color: '#f368e0' },
      { id: 'c2', position: 40, color: '#ff6b6b' },
      { id: 'c3', position: 70, color: '#feca57' },
      { id: 'c4', position: 100, color: '#01a3a4' },
    ],
  },
  {
    id: 'macaron',
    name: '马卡龙',
    stops: [
      { id: 'm1', position: 0, color: '#ffcccc' },
      { id: 'm2', position: 33, color: '#ffe0b2' },
      { id: 'm3', position: 66, color: '#b3e5fc' },
      { id: 'm4', position: 100, color: '#d1c4e9' },
    ],
  },
  {
    id: 'forest',
    name: '森林',
    stops: [
      { id: 'f1', position: 0, color: '#134e5e' },
      { id: 'f2', position: 50, color: '#2d5016' },
      { id: 'f3', position: 100, color: '#71b280' },
    ],
  },
  {
    id: 'ocean',
    name: '深海',
    stops: [
      { id: 'o1', position: 0, color: '#0f0c29' },
      { id: 'o2', position: 50, color: '#302b63' },
      { id: 'o3', position: 100, color: '#24243e' },
    ],
  },
];
