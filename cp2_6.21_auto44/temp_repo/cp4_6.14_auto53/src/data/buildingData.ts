export interface BuildingBlock {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  name: string;
}

const DEFAULT_BUILDINGS: BuildingBlock[] = [
  {
    id: 'building-1',
    position: [-6, 0, -4],
    size: [4, 8, 5],
    color: '#e2e8f0',
    name: '办公楼A'
  },
  {
    id: 'building-2',
    position: [2, 0, 2],
    size: [5, 12, 4],
    color: '#fde68a',
    name: '商业中心'
  },
  {
    id: 'building-3',
    position: [5, 0, -6],
    size: [3, 6, 6],
    color: '#a78bfa',
    name: '住宅楼'
  }
];

export const SHADOW_COLOR_PRESETS: { name: string; value: string }[] = [
  { name: '深灰', value: '#1a1a2e' },
  { name: '深蓝', value: '#16213e' },
  { name: '紫色', value: '#2d1b4e' },
  { name: '深绿', value: '#1a3a1a' },
  { name: '深红', value: '#3a1a1a' },
  { name: '黑色', value: '#000000' }
];

export { DEFAULT_BUILDINGS };
