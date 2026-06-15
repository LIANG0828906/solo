export type SymmetryType = 'rotation' | 'reflection' | 'translation';

export type BaseShape = 'circle' | 'triangle' | 'hexagon' | 'spiral';

export type ColorScheme = 'gradient' | 'complementary' | 'analogous';

export interface PatternParams {
  symmetryType: SymmetryType;
  baseShape: BaseShape;
  colorScheme: ColorScheme;
  complexity: number;
  rotationSpeed: number;
  baseColors: string[];
  backgroundColor: string;
}

export interface SavedPattern {
  id: string;
  params: PatternParams;
  svgUrl: string;
  thumbnailUrl: string;
  createdAt: string;
}

export interface SavePatternRequest {
  svgString: string;
  thumbnailBase64: string;
  params: PatternParams;
}

export interface SavePatternResponse {
  success: boolean;
  pattern: SavedPattern;
}

export interface PatternListResponse {
  patterns: SavedPattern[];
}

export const DEFAULT_PARAMS: PatternParams = {
  symmetryType: 'rotation',
  baseShape: 'circle',
  colorScheme: 'gradient',
  complexity: 10,
  rotationSpeed: 2,
  baseColors: ['#6366f1', '#a855f7', '#ec4899'],
  backgroundColor: '#1a1a2e',
};

export const BASE_COLOR_PALETTE = [
  '#ff6b6b', '#ee5a52', '#ff8e53', '#ffd93d',
  '#6bcb77', '#4ecdc4', '#45b7d1', '#6366f1',
  '#a855f7', '#ec4899', '#f472b6', '#ffffff',
];
