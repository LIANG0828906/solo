export interface ColorScheme {
  id: string;
  name: string;
  colors: string[];
}

export const ANCIENT_COLORS: { name: string; hex: string }[] = [
  { name: '宋瓷青', hex: '#78A29B' },
  { name: '檀木红', hex: '#8B4513' },
  { name: '琥珀黄', hex: '#D9A05B' },
  { name: '点翠蓝', hex: '#0072B5' },
  { name: '朱砂红', hex: '#C41E3A' },
  { name: '鹅黄', hex: '#FFF1B8' },
  { name: '藕荷色', hex: '#E4C2D4' },
  { name: '竹青色', hex: '#7BA23F' },
  { name: '胭脂色', hex: '#9D2933' },
  { name: '月白', hex: '#D6ECF0' },
  { name: '黛色', hex: '#3F4C5B' },
  { name: '蜜合色', hex: '#F0C987' },
  { name: '秋香色', hex: '#D4B955' },
  { name: '石青色', hex: '#1E4D6B' },
  { name: '水红色', hex: '#F5B7B1' },
  { name: '豆绿色', hex: '#82B541' },
  { name: '酱紫', hex: '#5C2E5C' },
  { name: '象牙白', hex: '#FFFEF0' },
  { name: '乌金黑', hex: '#1A1A1A' },
  { name: '蟹壳青', hex: '#8FA39C' },
  { name: '石榴红', hex: '#F2493A' },
  { name: '葡萄紫', hex: '#5D3A7A' },
  { name: '杏黄', hex: '#F2B84B' },
  { name: '湖蓝', hex: '#4A90A4' },
];

export const PRESET_SCHEMES: ColorScheme[] = [
  {
    id: 'song-yun',
    name: '宋韵',
    colors: ['#78A29B', '#E8D5B5', '#D9A05B', '#8B4513', '#F5E6CA'],
  },
  {
    id: 'tang-feng',
    name: '唐风',
    colors: ['#C41E3A', '#D9A05B', '#8B4513', '#F0C987', '#FFF1B8'],
  },
  {
    id: 'qing-dai',
    name: '清代',
    colors: ['#1E4D6B', '#5D3A7A', '#F5B7B1', '#F2B84B', '#F5F0E8'],
  },
  {
    id: 'ming-zhi',
    name: '明制',
    colors: ['#9D2933', '#D4B955', '#7BA23F', '#82B541', '#F5E6CA'],
  },
  {
    id: 'han-yun',
    name: '汉韵',
    colors: ['#0072B5', '#3F4C5B', '#D9A05B', '#8B4513', '#E8D5B5'],
  },
  {
    id: 'chun-xi',
    name: '春熙',
    colors: ['#E4C2D4', '#F5B7B1', '#F0C987', '#8FA39C', '#FFF1B8'],
  },
];

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
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return rgbToHex(
    c1.r + (c2.r - c1.r) * t,
    c1.g + (c2.g - c1.g) * t,
    c1.b + (c2.b - c1.b) * t
  );
}

export function colorDistance(c1: string, c2: string): number {
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  const r = rgb1.r - rgb2.r;
  const g = rgb1.g - rgb2.g;
  const b = rgb1.b - rgb2.b;
  return Math.sqrt(r * r + g * g + b * b);
}
