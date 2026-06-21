export interface PoemLine {
  id: string;
  text: string;
  x: number;
  y: number;
}

export interface BackgroundConfig {
  type: 'gradient' | 'texture';
  colors: string[];
  noiseIntensity: number;
}

export const FONT_OPTIONS = [
  { value: 'KaiTi, STKaiti, serif', label: '楷体' },
  { value: 'SimSun, STSong, serif', label: '宋体' },
  { value: 'Ma Shan Zheng, cursive, "STXingkai", "Hanzipen SC", "Comic Sans MS", cursive', label: '手写体' },
];

export const PRESET_GRADIENTS: string[][] = [
  ['#FF6B6B', '#C44A4A'],
  ['#4ECDC4', '#2C7A7A'],
  ['#667EEA', '#764BA2'],
  ['#F7DC6F', '#D4AC0D'],
  ['#BB8FCE', '#7D3C98'],
];
