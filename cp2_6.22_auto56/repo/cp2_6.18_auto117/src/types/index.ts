export interface FontScaleLevel {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
  letterSpacing: number;
}

export interface ExportConfig {
  levels: FontScaleLevel[];
  generatedAt: string;
}

export type GridBase = 4 | 8 | null;
