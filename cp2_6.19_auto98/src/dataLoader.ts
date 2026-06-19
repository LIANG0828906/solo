export interface DataPoint {
  id: number;
  name: string;
  value: number;
  category: number;
}

export type SortMode = 'valueAsc' | 'valueDesc' | 'category';

const MOCK_DATA: DataPoint[] = [
  { id: 1, name: '实验组 A-01', value: 85, category: 0 },
  { id: 2, name: '实验组 A-02', value: 62, category: 0 },
  { id: 3, name: '实验组 A-03', value: 94, category: 0 },
  { id: 4, name: '实验组 A-04', value: 47, category: 0 },
  { id: 5, name: '实验组 A-05', value: 73, category: 0 },
  { id: 6, name: '实验组 A-06', value: 55, category: 0 },
  { id: 7, name: '实验组 A-07', value: 88, category: 0 },
  { id: 8, name: '实验组 B-01', value: 36, category: 1 },
  { id: 9, name: '实验组 B-02', value: 79, category: 1 },
  { id: 10, name: '实验组 B-03', value: 51, category: 1 },
  { id: 11, name: '实验组 B-04', value: 68, category: 1 },
  { id: 12, name: '实验组 B-05', value: 92, category: 1 },
  { id: 13, name: '实验组 B-06', value: 44, category: 1 },
  { id: 14, name: '实验组 B-07', value: 77, category: 1 },
  { id: 15, name: '实验组 C-01', value: 63, category: 2 },
  { id: 16, name: '实验组 C-02', value: 81, category: 2 },
  { id: 17, name: '实验组 C-03', value: 58, category: 2 },
  { id: 18, name: '实验组 C-04', value: 96, category: 2 },
  { id: 19, name: '实验组 C-05', value: 42, category: 2 },
  { id: 20, name: '实验组 C-06', value: 70, category: 2 },
  { id: 21, name: '实验组 C-07', value: 89, category: 2 },
  { id: 22, name: '实验组 C-08', value: 53, category: 2 },
];

export function loadData(): DataPoint[] {
  return MOCK_DATA.map(d => ({ ...d }));
}

export function sortData(data: DataPoint[], mode: SortMode): DataPoint[] {
  const sorted = [...data];
  switch (mode) {
    case 'valueAsc':
      sorted.sort((a, b) => a.value - b.value);
      break;
    case 'valueDesc':
      sorted.sort((a, b) => b.value - a.value);
      break;
    case 'category':
      sorted.sort((a, b) => a.category - b.category || b.value - a.value);
      break;
  }
  return sorted;
}

export function filterByCategories(data: DataPoint[], categories: number[]): DataPoint[] {
  if (categories.length === 0) return [];
  return data.filter(d => categories.includes(d.category));
}

export const CATEGORY_COLORS: Record<number, { start: string; end: string; base: string; label: string }> = {
  0: { start: '#ff6b35', end: '#ffb347', base: '#ff8833', label: '对照组' },
  1: { start: '#6a11cb', end: '#2575fc', base: '#5c6bc0', label: '实验组 B' },
  2: { start: '#00c853', end: '#00e5ff', base: '#26a69a', label: '实验组 C' },
};

export function getCategoryColor(category: number, value: number): string {
  const colors = CATEGORY_COLORS[category];
  if (!colors) return '#ffffff';
  const t = value / 100;
  return interpolateColor(colors.start, colors.end, t);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
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

function interpolateColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return rgbToHex(c1.r + (c2.r - c1.r) * t, c1.g + (c2.g - c1.g) * t, c1.b + (c2.b - c1.b) * t);
}
