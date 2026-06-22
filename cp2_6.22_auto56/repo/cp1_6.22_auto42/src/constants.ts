import type {
  BrickColor,
  BrickSize,
  ColorMeta,
  Rotation,
  SizeMeta,
} from '@/types';

export const GRID_SIZE = 40;

export const MIN_SCALE = 0.5;
export const MAX_SCALE = 3;

export const COLOR_META: Record<BrickColor, ColorMeta> = {
  red: {
    key: 'red',
    name: '红色',
    primary: '#e53935',
    dark: '#b71c1c',
    light: '#ef5350',
    border: '#8b0000',
    studHighlight: '#ff8a80',
    shadow: '#8e1a1a',
  },
  yellow: {
    key: 'yellow',
    name: '黄色',
    primary: '#fdd835',
    dark: '#f9a825',
    light: '#ffee58',
    border: '#c17900',
    studHighlight: '#fff59d',
    shadow: '#b28704',
  },
  blue: {
    key: 'blue',
    name: '蓝色',
    primary: '#1e88e5',
    dark: '#0d47a1',
    light: '#42a5f5',
    border: '#002171',
    studHighlight: '#82b1ff',
    shadow: '#0a3a7a',
  },
  green: {
    key: 'green',
    name: '绿色',
    primary: '#43a047',
    dark: '#1b5e20',
    light: '#66bb6a',
    border: '#003300',
    studHighlight: '#a5d6a7',
    shadow: '#0d4d12',
  },
  white: {
    key: 'white',
    name: '白色',
    primary: '#ffffff',
    dark: '#cfcfcf',
    light: '#ffffff',
    border: '#9e9e9e',
    studHighlight: '#ffffff',
    shadow: '#a0a0a0',
  },
};

export const SIZE_META: Record<BrickSize, SizeMeta> = {
  '1x1': {
    key: '1x1',
    w: 1,
    h: 1,
    studsX: 1,
    studsY: 1,
    label: '1×1',
  },
  '1x2': {
    key: '1x2',
    w: 2,
    h: 1,
    studsX: 2,
    studsY: 1,
    label: '1×2',
  },
  '1x4': {
    key: '1x4',
    w: 4,
    h: 1,
    studsX: 4,
    studsY: 1,
    label: '1×4',
  },
  '2x2': {
    key: '2x2',
    w: 2,
    h: 2,
    studsX: 2,
    studsY: 2,
    label: '2×2',
  },
  '2x3': {
    key: '2x3',
    w: 3,
    h: 2,
    studsX: 3,
    studsY: 2,
    label: '2×3',
  },
  '2x4': {
    key: '2x4',
    w: 4,
    h: 2,
    studsX: 4,
    studsY: 2,
    label: '2×4',
  },
};

export const COLORS_LIST: ColorMeta[] = [
  COLOR_META.red,
  COLOR_META.yellow,
  COLOR_META.blue,
  COLOR_META.green,
  COLOR_META.white,
];

export const SIZES_LIST: SizeMeta[] = [
  SIZE_META['1x1'],
  SIZE_META['1x2'],
  SIZE_META['1x4'],
  SIZE_META['2x2'],
  SIZE_META['2x3'],
  SIZE_META['2x4'],
];

export function getColorMeta(color: BrickColor): ColorMeta {
  return COLOR_META[color];
}

export function getSizeMeta(type: BrickSize): SizeMeta {
  return SIZE_META[type];
}

export function getRotatedDimensions(
  type: BrickSize,
  rotation: Rotation
): { w: number; h: number; studsX: number; studsY: number } {
  const meta = getSizeMeta(type);
  if (rotation === 90 || rotation === 270) {
    return {
      w: meta.h,
      h: meta.w,
      studsX: meta.studsY,
      studsY: meta.studsX,
    };
  }
  return {
    w: meta.w,
    h: meta.h,
    studsX: meta.studsX,
    studsY: meta.studsY,
  };
}
