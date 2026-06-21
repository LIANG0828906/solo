export type EmotionType = 'passion' | 'calm' | 'joy' | 'mystery' | 'nature' | 'warmth';

export interface EmotionCard {
  id: EmotionType;
  label: string;
  emoji: string;
  bgColor: string;
}

export interface PaletteColors {
  primary: string;
  accent1: string;
  accent2: string;
  accent3: string;
  gradient: [string, string];
}

export interface ExportedPalette {
  timestamp: number;
  primaryHue: number;
  emotion: EmotionType;
  emotionLabel: string;
  colors: PaletteColors;
}
