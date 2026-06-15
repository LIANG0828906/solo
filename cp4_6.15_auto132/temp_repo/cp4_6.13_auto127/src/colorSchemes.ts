export type Mood = 'happy' | 'calm' | 'melancholy' | 'angry' | 'surprised' | 'inspired';

export interface ShapeWeights {
  triangle: number;
  quadrilateral: number;
  pentagon: number;
}

export interface ColorScheme {
  id: Mood;
  name: string;
  description: string;
  buttonColor: string;
  primary: string[];
  gradients: [string, string][];
  shapeWeights: ShapeWeights;
  icon: string;
  glowIntensity: number;
  progressColors: [string, string];
}

export const colorSchemes: Record<Mood, ColorScheme> = {
  happy: {
    id: 'happy',
    name: '快乐',
    description: '阳光般温暖，洒满心田的金色光芒',
    buttonColor: '#FFD93D',
    primary: ['#FFD93D', '#FF6B6B', '#FFA502', '#FF6348', '#FFEAA7', '#FDCB6E'],
    gradients: [
      ['#FFD93D', '#FF6B6B'],
      ['#FFA502', '#FF6348'],
      ['#FFEAA7', '#FDCB6E'],
      ['#FF6B6B', '#FFD93D'],
    ],
    shapeWeights: { triangle: 0.2, quadrilateral: 0.3, pentagon: 0.5 },
    icon: 'smile',
    glowIntensity: 0.9,
    progressColors: ['#FFD93D', '#FF6B6B'],
  },
  calm: {
    id: 'calm',
    name: '平静',
    description: '微风拂过湖面，水波不兴的宁静',
    buttonColor: '#6BCB77',
    primary: ['#6BCB77', '#4D96FF', '#00D2D3', '#7BED9F', '#A29BFE', '#81ECEC'],
    gradients: [
      ['#6BCB77', '#4D96FF'],
      ['#00D2D3', '#7BED9F'],
      ['#A29BFE', '#81ECEC'],
      ['#7BED9F', '#6BCB77'],
    ],
    shapeWeights: { triangle: 0.15, quadrilateral: 0.55, pentagon: 0.3 },
    icon: 'leaf',
    glowIntensity: 0.6,
    progressColors: ['#6BCB77', '#4D96FF'],
  },
  melancholy: {
    id: 'melancholy',
    name: '忧郁',
    description: '细雨敲窗，淡淡的思念如云般萦绕',
    buttonColor: '#6F69AC',
    primary: ['#6F69AC', '#95A5A6', '#778BEB', '#636E72', '#A29BFE', '#DFE6E9'],
    gradients: [
      ['#6F69AC', '#95A5A6'],
      ['#778BEB', '#636E72'],
      ['#A29BFE', '#DFE6E9'],
      ['#636E72', '#6F69AC'],
    ],
    shapeWeights: { triangle: 0.5, quadrilateral: 0.3, pentagon: 0.2 },
    icon: 'raindrop',
    glowIntensity: 0.4,
    progressColors: ['#6F69AC', '#95A5A6'],
  },
  angry: {
    id: 'angry',
    name: '愤怒',
    description: '烈焰燃烧，火山爆发般的炽热力量',
    buttonColor: '#FF4757',
    primary: ['#FF4757', '#FF6348', '#E84118', '#EB4D4B', '#C23616', '#FF7F50'],
    gradients: [
      ['#FF4757', '#FF6348'],
      ['#E84118', '#EB4D4B'],
      ['#C23616', '#FF7F50'],
      ['#EB4D4B', '#FF4757'],
    ],
    shapeWeights: { triangle: 0.7, quadrilateral: 0.2, pentagon: 0.1 },
    icon: 'flame',
    glowIntensity: 1.0,
    progressColors: ['#FF4757', '#FF6348'],
  },
  surprised: {
    id: 'surprised',
    name: '惊讶',
    description: '电光石火间，意想不到的奇迹降临',
    buttonColor: '#A55EEA',
    primary: ['#A55EEA', '#F368E0', '#4834DF', '#7D5FFF', '#E056FD', '#686DE0'],
    gradients: [
      ['#A55EEA', '#F368E0'],
      ['#4834DF', '#7D5FFF'],
      ['#E056FD', '#686DE0'],
      ['#7D5FFF', '#A55EEA'],
    ],
    shapeWeights: { triangle: 0.33, quadrilateral: 0.34, pentagon: 0.33 },
    icon: 'sparkle',
    glowIntensity: 0.85,
    progressColors: ['#A55EEA', '#F368E0'],
  },
  inspired: {
    id: 'inspired',
    name: '灵感',
    description: '缪斯降临，创意如繁星般闪烁天际',
    buttonColor: '#00CEC9',
    primary: ['#00CEC9', '#81ECEC', '#F8B500', '#55E6C1', '#1DD1A1', '#5F27CD'],
    gradients: [
      ['#00CEC9', '#81ECEC'],
      ['#F8B500', '#55E6C1'],
      ['#1DD1A1', '#5F27CD'],
      ['#55E6C1', '#00CEC9'],
    ],
    shapeWeights: { triangle: 0.3, quadrilateral: 0.35, pentagon: 0.35 },
    icon: 'bulb',
    glowIntensity: 0.8,
    progressColors: ['#00CEC9', '#5F27CD'],
  },
};

export const moodsList: Mood[] = ['happy', 'calm', 'melancholy', 'angry', 'surprised', 'inspired'];

export function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
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
  return [h * 360, s * 100, l * 100];
}

export function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;
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
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getComplementaryColor(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex((h + 180) % 360, Math.max(s, 60), Math.min(l + 10, 70));
}
