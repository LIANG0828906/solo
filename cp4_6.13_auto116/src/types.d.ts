declare global {
  const THREE: any;
}

export interface FrequencyData {
  low: number;
  mid: number;
  high: number;
}

export interface ThemeConfig {
  name: string;
  particleHue: [number, number];
  bgColor: number;
  starColor: number;
  glowIntensity: number;
}

export {};
