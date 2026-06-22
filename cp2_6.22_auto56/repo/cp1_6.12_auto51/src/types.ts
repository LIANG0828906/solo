export interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorConfig {
  ma5: boolean;
  ma20: boolean;
  rsi: boolean;
}

export interface ChartViewport {
  startIndex: number;
  endIndex: number;
  totalCount: number;
  isMinuteLevel: boolean;
}

export interface CalculatedIndicators {
  ma5: (number | null)[];
  ma20: (number | null)[];
  rsi: (number | null)[];
}

export interface HoverInfo {
  dataIndex: number;
  screenX: number;
  screenY: number;
  data: StockData;
}

export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  mainHeight: number;
  rsiHeight: number;
  volumeHeight: number;
}
