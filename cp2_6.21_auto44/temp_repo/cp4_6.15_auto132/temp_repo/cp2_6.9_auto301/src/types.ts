export enum SilkColor {
  RED = '#c0392b',
  YELLOW = '#f1c40f',
  BLUE = '#2980b9',
  GREEN = '#27ae60',
  PURPLE = '#8e44ad',
  WHITE = '#ecf0f1',
  BLACK = '#2c3e50',
  GOLD = '#b8860b',
}

export const SilkColorNames: Record<SilkColor, string> = {
  [SilkColor.RED]: '朱红',
  [SilkColor.YELLOW]: '鹅黄',
  [SilkColor.BLUE]: '石青',
  [SilkColor.GREEN]: '翠绿',
  [SilkColor.PURPLE]: '紫檀',
  [SilkColor.WHITE]: '月白',
  [SilkColor.BLACK]: '玄黑',
  [SilkColor.GOLD]: '赤金',
};

export const SilkColorCodes: Record<SilkColor, string> = {
  [SilkColor.RED]: 'S-001',
  [SilkColor.YELLOW]: 'S-002',
  [SilkColor.BLUE]: 'S-003',
  [SilkColor.GREEN]: 'S-004',
  [SilkColor.PURPLE]: 'S-005',
  [SilkColor.WHITE]: 'S-006',
  [SilkColor.BLACK]: 'S-007',
  [SilkColor.GOLD]: 'S-008',
};

export type PatternCell = number;

export interface PatternGrid {
  name: string;
  cells: PatternCell[][];
}

export interface LoomState {
  rotationAngle: number;
  currentRow: number;
  isWeaving: boolean;
  selectedColors: SilkColor[];
  weftSequence: SilkColor[];
}

export interface WovenResult {
  dataUrl: string;
  patternName: string;
  serialNumber: string;
  dateStamp: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export const ALL_SILK_COLORS: SilkColor[] = [
  SilkColor.RED,
  SilkColor.YELLOW,
  SilkColor.BLUE,
  SilkColor.GREEN,
  SilkColor.PURPLE,
  SilkColor.WHITE,
  SilkColor.BLACK,
  SilkColor.GOLD,
];
