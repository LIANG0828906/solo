export interface WordItem {
  text: string;
  frequency: number;
  indices: number[];
}

export interface AnalyzeResult {
  words: WordItem[];
  totalWords: number;
}

export type ThemeType = 'light' | 'dark' | 'retro' | 'minimal';
export type FontStyle = 'serif' | 'sans-serif' | 'handwriting';

export interface CloudConfig {
  maxWords: number;
  fontStyle: FontStyle;
  rotation: number;
  compactness: number;
}

export interface ThemeConfig {
  name: string;
  background: string;
  colorScale: (t: number) => string;
  getTextColor: (t: number, freqRatio: number) => string;
}
