export type ChartType = 'line' | 'bar' | 'pie';

export interface DataRow {
  [key: string]: string | number;
}

export interface ThemeConfig {
  key: string;
  name: string;
  colors: string[];
  bgPrimary: string;
  bgSecondary: string;
  borderColor: string;
  glowColor: string;
  textPrimary: string;
  textSecondary: string;
  rowAlt: string;
  rowSelected: string;
  scrollbar: string;
}

export interface ChartCardConfig {
  id: string;
  title: string;
  chartType: ChartType;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface StatsSummary {
  sum: number;
  average: number;
  max: number;
  min: number;
  selectedLabel?: string | null;
  selectedValue?: number | null;
}
