export interface FlagData {
  id: string;
  position: [number, number, number];
  color: string;
  index: number;
}

export interface PathData {
  id: string;
  startFlagId: string;
  endFlagId: string;
  points: [number, number, number][];
}

export type FlagColor =
  | '#c0392b'
  | '#f1c40f'
  | '#27ae60'
  | '#2c3e50'
  | '#ecf0f1'
  | '#2d2d2d'
  | '#8e44ad'
  | '#2980b9';

export const FLAG_COLORS: FlagColor[] = [
  '#c0392b',
  '#f1c40f',
  '#27ae60',
  '#2c3e50',
  '#ecf0f1',
  '#2d2d2d',
  '#8e44ad',
  '#2980b9',
];
