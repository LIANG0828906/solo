export interface ConstellationPoint {
  x: number;
  y: number;
  name?: string;
}

export interface ConstellationLine {
  from: number;
  to: number;
}

export interface Constellation {
  name: string;
  latinName: string;
  points: ConstellationPoint[];
  lines: ConstellationLine[];
  centerPoint: { x: number; y: number };
}

export const SHICHEN_LIST: string[] = [
  '子时', '丑时', '寅时', '卯时',
  '辰时', '巳时', '午时', '未时',
  '申时', '酉时', '戌时', '亥时'
];

export const SHICHEN_CONSTELLATION_MAP: Record<string, string> = {
  '子时': '水瓶座',
  '丑时': '双鱼座',
  '寅时': '白羊座',
  '卯时': '金牛座',
  '辰时': '双子座',
  '巳时': '巨蟹座',
  '午时': '狮子座',
  '未时': '处女座',
  '申时': '天秤座',
  '酉时': '天蝎座',
  '戌时': '射手座',
  '亥时': '摩羯座'
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(lerp(c1.r, c2.r, t));
  const g = Math.round(lerp(c1.g, c2.g, t));
  const b = Math.round(lerp(c1.b, c2.b, t));
  return `rgb(${r}, ${g}, ${b})`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function easeInQuad(t: number): number {
  return t * t;
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function getShichenFromTime(hour: number, minute: number): string {
  const totalMinutes = hour * 60 + minute;
  const adjustedMinutes = (totalMinutes + 60) % 1440;
  const index = Math.floor(adjustedMinutes / 120) % 12;
  return SHICHEN_LIST[index];
}

export function formatTime(hour: number, minute: number): string {
  const h = Math.floor(hour) % 24;
  const m = Math.floor(minute) % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function getSeasonFromMonth(month: number): '春' | '夏' | '秋' | '冬' {
  const m = ((month - 1) % 12) + 1;
  if (m >= 3 && m <= 5) return '春';
  if (m >= 6 && m <= 8) return '夏';
  if (m >= 9 && m <= 11) return '秋';
  return '冬';
}

export const CONSTELLATIONS_DATA: Record<string, Constellation> = {
  '水瓶座': {
    name: '水瓶座',
    latinName: 'Aquarius',
    centerPoint: { x: 0.2, y: -0.3 },
    points: [
      { x: -1.8, y: 1.2 }, { x: -1.2, y: 0.8 }, { x: -0.5, y: 1.0 },
      { x: 0.0, y: 0.5 }, { x: 0.8, y: 0.6 }, { x: 1.5, y: 0.2 },
      { x: 1.0, y: -0.5 }, { x: 0.3, y: -1.0 }, { x: -0.8, y: -0.8 },
      { x: -1.5, y: -0.3 }
    ],
    lines: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 6 },
      { from: 6, to: 7 }, { from: 7, to: 8 }, { from: 8, to: 9 },
      { from: 3, to: 7 }
    ]
  },
  '双鱼座': {
    name: '双鱼座',
    latinName: 'Pisces',
    centerPoint: { x: 0, y: 0 },
    points: [
      { x: -2.0, y: 0.5 }, { x: -1.5, y: 0.0 }, { x: -1.0, y: -0.5 },
      { x: -0.5, y: 0.0 }, { x: 0.0, y: 0.5 }, { x: 0.5, y: 0.0 },
      { x: 1.0, y: -0.5 }, { x: 1.5, y: 0.0 }, { x: 2.0, y: 0.5 },
      { x: 1.2, y: 1.0 }, { x: 0.0, y: 1.2 }, { x: -1.2, y: 1.0 }
    ],
    lines: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 6 },
      { from: 6, to: 7 }, { from: 7, to: 8 }, { from: 4, to: 10 },
      { from: 10, to: 11 }, { from: 10, to: 9 }
    ]
  },
  '白羊座': {
    name: '白羊座',
    latinName: 'Aries',
    centerPoint: { x: -0.2, y: 0.3 },
    points: [
      { x: -2.0, y: -0.8 }, { x: -1.2, y: -0.3 }, { x: -0.5, y: 0.2 },
      { x: 0.2, y: 0.5 }, { x: 0.8, y: 1.0 }, { x: 1.5, y: 1.2 },
      { x: 0.5, y: -0.3 }, { x: 1.2, y: -0.8 }
    ],
    lines: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 2, to: 6 },
      { from: 6, to: 7 }
    ]
  },
  '金牛座': {
    name: '金牛座',
    latinName: 'Taurus',
    centerPoint: { x: -0.5, y: 0.2 },
    points: [
      { x: -2.2, y: 0.5 }, { x: -1.5, y: 1.0 }, { x: -0.8, y: 0.6 },
      { x: -0.2, y: 0.3 }, { x: 0.5, y: 0.8 }, { x: 1.2, y: 0.5 },
      { x: 1.8, y: -0.2 }, { x: 1.0, y: -0.8 }, { x: 0.0, y: -0.5 },
      { x: -1.0, y: -0.8 }, { x: -1.8, y: -0.3 }
    ],
    lines: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 6 },
      { from: 3, to: 7 }, { from: 7, to: 8 }, { from: 8, to: 9 },
      { from: 9, to: 10 }, { from: 8, to: 3 }
    ]
  },
  '双子座': {
    name: '双子座',
    latinName: 'Gemini',
    centerPoint: { x: 0, y: 0 },
    points: [
      { x: -1.5, y: 1.5 }, { x: -1.8, y: 0.5 }, { x: -1.2, y: -0.5 },
      { x: -0.8, y: -1.5 }, { x: 0.0, y: -0.2 }, { x: 0.8, y: -1.5 },
      { x: 1.2, y: -0.5 }, { x: 1.8, y: 0.5 }, { x: 1.5, y: 1.5 },
      { x: 0.0, y: 0.8 }
    ],
    lines: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 8, to: 7 }, { from: 7, to: 6 }, { from: 6, to: 5 },
      { from: 1, to: 7 }, { from: 2, to: 4 }, { from: 4, to: 6 },
      { from: 4, to: 9 }, { from: 9, to: 0 }, { from: 9, to: 8 }
    ]
  },
  '巨蟹座': {
    name: '巨蟹座',
    latinName: 'Cancer',
    centerPoint: { x: 0, y: -0.2 },
    points: [
      { x: -1.8, y: 0.3 }, { x: -1.2, y: 0.8 }, { x: -0.5, y: 0.5 },
      { x: 0.0, y: 0.0 }, { x: 0.5, y: 0.5 }, { x: 1.2, y: 0.8 },
      { x: 1.8, y: 0.3 }, { x: 1.0, y: -0.5 }, { x: 0.0, y: -1.0 },
      { x: -1.0, y: -0.5 }
    ],
    lines: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 6 },
      { from: 3, to: 8 }, { from: 8, to: 7 }, { from: 8, to: 9 },
      { from: 9, to: 2 }, { from: 7, to: 4 }
    ]
  },
  '狮子座': {
    name: '狮子座',
    latinName: 'Leo',
    centerPoint: { x: 0.2, y: 0.2 },
    points: [
      { x: -2.0, y: -0.5 }, { x: -1.5, y: 0.3 }, { x: -1.0, y: 0.8 },
      { x: -0.3, y: 1.2 }, { x: 0.5, y: 1.0 }, { x: 1.0, y: 0.3 },
      { x: 1.5, y: -0.3 }, { x: 2.0, y: -1.0 }, { x: 1.0, y: -1.2 },
      { x: 0.0, y: -0.8 }, { x: -0.8, y: -1.0 }, { x: -1.5, y: -1.2 }
    ],
    lines: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 6 },
      { from: 6, to: 7 }, { from: 5, to: 8 }, { from: 8, to: 9 },
      { from: 9, to: 10 }, { from: 10, to: 11 }, { from: 9, to: 0 }
    ]
  },
  '处女座': {
    name: '处女座',
    latinName: 'Virgo',
    centerPoint: { x: 0.1, y: -0.1 },
    points: [
      { x: -1.5, y: 1.5 }, { x: -1.8, y: 0.5 }, { x: -1.2, y: -0.2 },
      { x: -0.5, y: 0.3 }, { x: 0.0, y: 0.0 }, { x: 0.5, y: 0.5 },
      { x: 1.2, y: 0.0 }, { x: 1.8, y: -0.5 }, { x: 1.5, y: -1.5 },
      { x: 0.5, y: -1.2 }, { x: -0.5, y: -1.0 }, { x: -1.2, y: -1.5 }
    ],
    lines: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 6 },
      { from: 6, to: 7 }, { from: 7, to: 8 }, { from: 4, to: 9 },
      { from: 9, to: 10 }, { from: 10, to: 11 }, { from: 2, to: 10 }
    ]
  },
  '天秤座': {
    name: '天秤座',
    latinName: 'Libra',
    centerPoint: { x: 0, y: 0 },
    points: [
      { x: -1.8, y: 1.0 }, { x: -1.0, y: 0.5 }, { x: 0.0, y: 0.8 },
      { x: 1.0, y: 0.5 }, { x: 1.8, y: 1.0 }, { x: 1.2, y: -0.3 },
      { x: 0.0, y: -0.8 }, { x: -1.2, y: -0.3 }, { x: -0.5, y: -1.5 },
      { x: 0.5, y: -1.5 }
    ],
    lines: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 3, to: 4 }, { from: 1, to: 7 }, { from: 7, to: 6 },
      { from: 6, to: 5 }, { from: 5, to: 3 }, { from: 6, to: 8 },
      { from: 6, to: 9 }
    ]
  },
  '天蝎座': {
    name: '天蝎座',
    latinName: 'Scorpius',
    centerPoint: { x: -0.2, y: -0.1 },
    points: [
      { x: -2.0, y: 0.8 }, { x: -1.4, y: 1.0 }, { x: -0.8, y: 0.5 },
      { x: -0.2, y: 0.8 }, { x: 0.4, y: 0.5 }, { x: 1.0, y: 0.2 },
      { x: 1.6, y: -0.3 }, { x: 1.8, y: -1.0 }, { x: 1.2, y: -1.3 },
      { x: 0.5, y: -0.8 }, { x: -0.3, y: -0.5 }, { x: -1.0, y: -0.8 },
      { x: -1.6, y: -0.3 }
    ],
    lines: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 6 },
      { from: 6, to: 7 }, { from: 7, to: 8 }, { from: 5, to: 9 },
      { from: 9, to: 10 }, { from: 10, to: 11 }, { from: 11, to: 12 },
      { from: 2, to: 10 }
    ]
  },
  '射手座': {
    name: '射手座',
    latinName: 'Sagittarius',
    centerPoint: { x: 0.1, y: 0 },
    points: [
      { x: -1.8, y: -1.0 }, { x: -1.2, y: -0.3 }, { x: -0.5, y: 0.3 },
      { x: 0.0, y: -0.2 }, { x: 0.5, y: 0.3 }, { x: 1.2, y: -0.3 },
      { x: 1.8, y: -1.0 }, { x: 0.0, y: 1.2 }, { x: -1.0, y: 1.0 },
      { x: 1.0, y: 1.0 }
    ],
    lines: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 6 },
      { from: 2, to: 8 }, { from: 8, to: 7 }, { from: 7, to: 9 },
      { from: 9, to: 4 }, { from: 7, to: 3 }
    ]
  },
  '摩羯座': {
    name: '摩羯座',
    latinName: 'Capricornus',
    centerPoint: { x: -0.1, y: -0.3 },
    points: [
      { x: -2.0, y: 0.0 }, { x: -1.4, y: -0.5 }, { x: -0.8, y: 0.0 },
      { x: -0.2, y: -0.5 }, { x: 0.4, y: 0.0 }, { x: 1.0, y: -0.5 },
      { x: 1.6, y: 0.0 }, { x: 1.2, y: 0.8 }, { x: 0.5, y: 1.0 },
      { x: -0.3, y: 0.8 }, { x: -1.0, y: 1.0 }, { x: -1.8, y: 0.8 }
    ],
    lines: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 6 },
      { from: 2, to: 11 }, { from: 11, to: 10 }, { from: 10, to: 9 },
      { from: 9, to: 8 }, { from: 8, to: 7 }, { from: 7, to: 4 },
      { from: 9, to: 2 }
    ]
  }
};
