export type ChartType = 'bar' | 'line' | 'pie';

export type ThemeMode = 'light' | 'dark';

export type DataRange = '7d' | '30d' | 'all';

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ChartItem {
  id: string;
  type: ChartType;
  title: string;
  theme: ThemeMode;
  dataRange: DataRange;
  data: ChartDataPoint[];
  position: number;
}

export interface DashboardConfig {
  charts: ChartItem[];
  globalTheme: ThemeMode;
}

export interface HistoryState {
  charts: ChartItem[];
}
