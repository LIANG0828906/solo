export interface DataPoint {
  timestamp: number;
  values: number[];
}

export interface Annotation {
  id: string;
  timestamp: number;
  value: number;
  note: string;
  createdAt: number;
}

export interface AggregatedAnnotation {
  id: string;
  timestamp: number;
  value: number;
  count: number;
  annotations: Annotation[];
}

export interface TrendResult {
  slope: number;
  intercept: number;
  rSquared: number;
}

export interface MovingAveragePoint {
  timestamp: number;
  value: number;
}

export interface CSVParseResult {
  columns: string[];
  data: DataPoint[];
  error?: string;
}

export interface TimeRange {
  start: number;
  end: number;
}
