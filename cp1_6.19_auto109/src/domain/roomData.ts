export type StyleId = 'nordic' | 'japanese' | 'industrial' | 'luxury';
export type MaterialType = 'smooth' | 'matte' | 'fabric' | 'leather';
export type FurnitureType = 'sofa' | 'table' | 'tvCabinet' | 'diningTable' | 'bookshelf';
export type DecorationType = 'pillow' | 'vase' | 'lamp' | 'rug';
export type SizeType = 'small' | 'medium' | 'large';

export interface FurniturePreset {
  id: FurnitureType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  defaultColor: string;
}

export interface FurnitureState {
  id: FurnitureType;
  color: string;
  material: MaterialType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DecorationState {
  id: string;
  type: DecorationType;
  x: number;
  y: number;
  size: SizeType;
}

export interface StyleConfig {
  id: StyleId;
  name: string;
  keywords: string[];
  wallColor: string;
  floorColor1: string;
  floorColor2: string;
  furniture: Record<FurnitureType, { color: string; material: MaterialType }>;
}

export const PRESET_COLORS: string[] = [
  '#E07A5F',
  '#5A7A9A',
  '#D4A373',
  '#81B29A',
  '#6B5B73',
  '#F2CC8F',
];

export const MATERIALS: { id: MaterialType; name: string }[] = [
  { id: 'smooth', name: '光滑' },
  { id: 'matte', name: '磨砂' },
  { id: 'fabric', name: '布艺' },
  { id: 'leather', name: '皮革' },
];

export const DECORATION_LIMITS: Record<DecorationType, number> = {
  pillow: 2,
  vase: 2,
  lamp: 2,
  rug: 2,
};

export const DECORATION_NAMES: Record<DecorationType, string> = {
  pillow: '抱枕',
  vase: '花瓶',
  lamp: '台灯',
  rug: '地毯',
};

export const SIZE_SCALE: Record<SizeType, number> = {
  small: 0.7,
  medium: 1,
  large: 1.4,
};

export const DECORATION_TYPES: DecorationType[] = ['pillow', 'vase', 'lamp', 'rug'];

export const DECORATION_ICONS: Record<DecorationType, string> = {
  pillow: 'pillow',
  vase: 'vase',
  lamp: 'lamp',
  rug: 'rug',
};

export const STYLES: StyleConfig[] = [
  {
    id: 'nordic',
    name: '北欧简约',
    keywords: ['浅色', '棉麻', '暖光', '简洁', '自然'],
    wallColor: '#F5F1E8',
    floorColor1: '#E8DFD0',
    floorColor2: '#D9CCB8',
    furniture: {
      sofa: { color: '#B8C5D1', material: 'fabric' },
      table: { color: '#D4A373', material: 'matte' },
      tvCabinet: { color: '#F5F1E8', material: 'smooth' },
      diningTable: { color: '#C9B896', material: 'matte' },
      bookshelf: { color: '#E0D5C2', material: 'smooth' },
    },
  },
  {
    id: 'japanese',
    name: '日式原木',
    keywords: ['原木', '禅意', '素雅', '榻榻米', '自然'],
    wallColor: '#EDE4D3',
    floorColor1: '#C4A574',
    floorColor2: '#B39566',
    furniture: {
      sofa: { color: '#A67C52', material: 'fabric' },
      table: { color: '#C69B6A', material: 'matte' },
      tvCabinet: { color: '#8B6F47', material: 'smooth' },
      diningTable: { color: '#9C7A52', material: 'matte' },
      bookshelf: { color: '#B08857', material: 'smooth' },
    },
  },
  {
    id: 'industrial',
    name: '工业复古',
    keywords: ['金属', '水泥', '粗犷', '复古', '硬朗'],
    wallColor: '#9A9A9A',
    floorColor1: '#6B6B6B',
    floorColor2: '#5A5A5A',
    furniture: {
      sofa: { color: '#3D3D3D', material: 'leather' },
      table: { color: '#6D4C41', material: 'matte' },
      tvCabinet: { color: '#2C2C2C', material: 'smooth' },
      diningTable: { color: '#5D4037', material: 'matte' },
      bookshelf: { color: '#484848', material: 'smooth' },
    },
  },
  {
    id: 'luxury',
    name: '现代轻奢',
    keywords: ['金色', '大理石', '精致', '华丽', '质感'],
    wallColor: '#E8E0D5',
    floorColor1: '#D4C5A9',
    floorColor2: '#C2B192',
    furniture: {
      sofa: { color: '#2C3E50', material: 'leather' },
      table: { color: '#D4A373', material: 'smooth' },
      tvCabinet: { color: '#1A1A2E', material: 'smooth' },
      diningTable: { color: '#34495E', material: 'smooth' },
      bookshelf: { color: '#16213E', material: 'smooth' },
    },
  },
];

export const FURNITURE_LAYOUT: Record<FurnitureType, FurniturePreset> = {
  sofa: {
    id: 'sofa',
    name: '沙发',
    x: 80,
    y: 220,
    width: 200,
    height: 70,
    defaultColor: '#B8C5D1',
  },
  table: {
    id: 'table',
    name: '茶几',
    x: 130,
    y: 320,
    width: 100,
    height: 50,
    defaultColor: '#D4A373',
  },
  tvCabinet: {
    id: 'tvCabinet',
    name: '电视柜',
    x: 80,
    y: 420,
    width: 200,
    height: 35,
    defaultColor: '#F5F1E8',
  },
  diningTable: {
    id: 'diningTable',
    name: '餐桌',
    x: 340,
    y: 240,
    width: 120,
    height: 80,
    defaultColor: '#C9B896',
  },
  bookshelf: {
    id: 'bookshelf',
    name: '书架',
    x: 400,
    y: 380,
    width: 60,
    height: 100,
    defaultColor: '#E0D5C2',
  },
};

export const ROOM_CONFIG = {
  width: 560,
  height: 520,
  wallThickness: 12,
};

export function getStyleById(id: StyleId): StyleConfig {
  return STYLES.find((s) => s.id === id) || STYLES[0];
}

export function createFurnitureFromStyle(style: StyleConfig): FurnitureState[] {
  return Object.values(FURNITURE_LAYOUT).map((preset) => ({
    id: preset.id,
    color: style.furniture[preset.id].color,
    material: style.furniture[preset.id].material,
    x: preset.x,
    y: preset.y,
    width: preset.width,
    height: preset.height,
  }));
}

export function updateFurnitureColor(
  furniture: FurnitureState[],
  id: FurnitureType,
  color: string
): FurnitureState[] {
  return furniture.map((f) => (f.id === id ? { ...f, color } : f));
}

export function updateFurnitureMaterial(
  furniture: FurnitureState[],
  id: FurnitureType,
  material: MaterialType
): FurnitureState[] {
  return furniture.map((f) => (f.id === id ? { ...f, material } : f));
}
