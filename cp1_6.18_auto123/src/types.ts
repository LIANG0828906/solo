export interface FontGeneProfile {
  weight: number;
  slant: number;
  serifAmount: number;
  curveTension: number;
  decorationComplexity: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface CharGlyph {
  char: string;
  unicode: number;
  outline: Point[][];
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  advanceWidth: number;
}

export type FontStyle = 'regular' | 'bold' | 'italic' | 'bold-italic';

export type InputMode = 'upload' | 'handwrite';

export interface AppState {
  inputMode: InputMode;
  uploadedImage: string | null;
  recognizedGlyphs: CharGlyph[];
  geneProfile: FontGeneProfile;
  previewText: string;
  isExporting: boolean;
  exportProgress: number;
  showExportToast: boolean;
}

export interface RecognitionResult {
  glyphs: CharGlyph[];
  processingTime: number;
}

export const GENE_DEFAULTS: FontGeneProfile = {
  weight: 50,
  slant: 0,
  serifAmount: 0,
  curveTension: 50,
  decorationComplexity: 0,
};

export const GENE_RANGES = {
  weight: { min: 0, max: 100, step: 1 },
  slant: { min: -45, max: 45, step: 1 },
  serifAmount: { min: 0, max: 20, step: 0.5 },
  curveTension: { min: 0, max: 100, step: 1 },
  decorationComplexity: { min: 0, max: 10, step: 1 },
};

export const GENE_LABELS: Record<keyof FontGeneProfile, string> = {
  weight: '粗细',
  slant: '倾斜度',
  serifAmount: '衬线幅度',
  curveTension: '曲线张力',
  decorationComplexity: '装饰复杂度',
};

export const GENE_UNITS: Record<keyof FontGeneProfile, string> = {
  weight: '',
  slant: '°',
  serifAmount: 'px',
  curveTension: '',
  decorationComplexity: '',
};
