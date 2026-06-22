export interface ColorItem {
  id: string;
  hex: string;
  name: string;
  role: string;
}

export type SimulationType = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface ContrastResult {
  ratio: number;
  aaLarge: boolean;
  aaNormal: boolean;
  aaaLarge: boolean;
  aaaNormal: boolean;
}
