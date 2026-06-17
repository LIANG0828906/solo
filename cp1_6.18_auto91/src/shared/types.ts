export type FlavorDimension = 'salt' | 'sweet' | 'sour' | 'umami' | 'bitter' | 'spicy';

export interface FlavorScores {
  salt: number;
  sweet: number;
  sour: number;
  umami: number;
  bitter: number;
  spicy: number;
}

export interface FlavorProfile {
  id: string;
  name: string;
  scores: FlavorScores;
  color: string;
  visible: boolean;
}

export interface PresetFlavor {
  id: string;
  name: string;
  scores: FlavorScores;
}

export interface ComparisonData {
  profiles: FlavorProfile[];
  averageScores: FlavorScores;
  recommendedPresetId: string | null;
}

export interface RenderHitRegion {
  profileId: string;
  path: Path2D;
}

export interface RenderResult {
  hitRegions: RenderHitRegion[];
}

export const DIMENSION_LABELS: Record<FlavorDimension, string> = {
  salt: '盐',
  sweet: '糖',
  sour: '酸度',
  umami: '鲜度',
  bitter: '苦度',
  spicy: '辛辣度',
};

export const DIMENSION_ORDER: FlavorDimension[] = [
  'salt',
  'sweet',
  'sour',
  'umami',
  'bitter',
  'spicy',
];

export const MAX_PROFILES = 5;
export const SCORE_MIN = 0;
export const SCORE_MAX = 10;
export const SCORE_STEP = 1;

export const COLOR_PALETTE: string[] = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#6C63FF',
  '#FF8C42',
  '#6BCB77',
  '#FF6F91',
  '#5DADE2',
  '#F4D03F',
];
