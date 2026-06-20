export interface IconData {
  id: string;
  name: string;
  svgContent: string;
  order: number;
  color: string;
}

export interface PreviewConfig {
  iconSize: number;
  gap: number;
}

export interface FontResult {
  fontData: string;
  cssContent: string;
  htmlDemo: string;
  jsonMetadata: string;
}

export const PRESET_COLORS: string[] = [
  '#00D4AA',
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#95E1D3',
  '#A8E6CF',
  '#DDA0DD',
  '#E0E0E0',
];

export const UNICODE_START = 0xe000;
