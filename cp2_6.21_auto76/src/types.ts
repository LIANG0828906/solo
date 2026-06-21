export interface PathCommand {
  type: 'M' | 'L' | 'C' | 'Q' | 'Z';
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export interface GlyphData {
  commands: PathCommand[];
  advanceWidth: number;
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  nodeCount: number;
}

export interface FontMetadata {
  id: string;
  name: string;
  familyName: string;
  styleName: string;
  unitsPerEm: number;
  ascender: number;
  descender: number;
  uploadTime: string;
}

export interface ParsedFont extends FontMetadata {
  glyphs: Record<string, GlyphData>;
  kerningValues: Record<string, number>;
  samplePaths: Record<string, PathCommand[]>;
}

export interface LayoutParams {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  alignment: 'left' | 'center' | 'right';
  text: string;
}

export interface RenderResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  lineMetrics: LineMetrics[];
}

export interface LineMetrics {
  text: string;
  y: number;
  height: number;
  width: number;
  charPositions: CharPosition[];
}

export interface CharPosition {
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GlyphDiffStats {
  strokeWidthDiff: number;
  nodeCountDiff: number;
  advanceWidthDiff: number;
  boundingBoxWidthDiff: number;
  boundingBoxHeightDiff: number;
}

export interface DiffRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  charIndex: number;
  lineIndex: number;
  fontAIndex: number;
  fontBIndex: number;
  stats: GlyphDiffStats;
}

export interface DiffResult {
  diffImageData: ImageData;
  diffRegions: DiffRegion[];
}

export interface ComparisonReport {
  exportTime: string;
  fonts: Array<{
    name: string;
    familyName: string;
    styleName: string;
    uploadTime: string;
  }>;
  layoutParams: LayoutParams;
  lineDiffStats: Array<{
    lineIndex: number;
    text: string;
    fontStats: Array<{
      fontName: string;
      lineWidth: number;
      lineHeight: number;
    }>;
    maxLineWidthDiff: number;
    maxLineHeightDiff: number;
  }>;
}

export type Alignment = 'left' | 'center' | 'right';

export const DEFAULT_TEXT = 'AaBbCcDdEeFfGg 你好世界 Hello 123!';

export const DEFAULT_LAYOUT: LayoutParams = {
  fontSize: 32,
  lineHeight: 1.5,
  letterSpacing: 0,
  alignment: 'left',
  text: DEFAULT_TEXT,
};

export const SAMPLE_CHARS = 'AaBbCc123';
