export type FieldType = 'time' | 'numeric' | 'categorical';

export interface CSVField {
  name: string;
  type: FieldType;
  color: string;
}

export interface ParsedCSVData {
  headers: CSVField[];
  rows: Record<string, any>[];
  rowCount: number;
}

export interface ChartConfig {
  xField: string;
  yFields: string[];
  fieldColors: Record<string, string>;
  showTrendLine: boolean;
}

export interface TurningPoint {
  index: number;
  xValue: Date;
  yValue: number;
  field: string;
  slopeChange: number;
  description: string;
}

export interface TrendLine {
  field: string;
  slope: number;
  intercept: number;
  color: string;
}

export type SceneType = 'opening' | 'turning-point' | 'trend' | 'summary';

export interface StoryScene {
  id: string;
  type: SceneType;
  title: string;
  content: string;
  highlightData?: Record<string, number>;
  chartAnnotation?: TurningPoint;
  animationDelay: number;
}

export interface LineVisibility {
  [key: string]: boolean;
}

export const SATURATED_COLORS = [
  '#FF5733',
  '#33FF57',
  '#3357FF',
  '#FF33A6',
  '#33FFF5',
  '#F5FF33',
  '#FF8C33',
  '#8C33FF'
];
