export interface StockDataPoint {
  timestamp: number;
  price: number;
  volume: number;
}

export interface Annotation {
  id: string;
  stockId: string;
  timestamp: number;
  text: string;
  color: string;
}

export interface Stock {
  id: string;
  code: string;
  name: string;
  basePrice: number;
  data: StockDataPoint[];
  color: string;
  annotations: Annotation[];
  lastPrice: number;
  prevPrice: number;
}

export interface PanelState {
  selectedStockId: string | null;
  searchQuery: string;
  expandedAnnotationStockId: string | null;
}

export interface ChartState {
  viewOffset: number;
  targetViewOffset: number;
  hoveredPoint: { stockId: string; index: number; x: number; y: number } | null;
  isDragging: boolean;
  dragStartX: number;
  dragStartOffset: number;
}

export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  value: number;
  stockName: string;
  opacity: number;
  scale: number;
  targetOpacity: number;
  targetScale: number;
}

export interface TimeAxis {
  x: number;
  y: number;
  width: number;
  height: number;
  thumbX: number;
  thumbWidth: number;
}

export interface AnimatedPrice {
  element: HTMLElement;
  currentValue: number;
  targetValue: number;
  startTime: number;
  duration: number;
}

export interface LineAnimation {
  progress: number;
  startTime: number;
  duration: number;
}

export const STOCK_COLORS = [
  '#00d4ff',
  '#9d4edd',
  '#ff6b6b',
  '#4ecdc4',
  '#ffe66d',
  '#ff8a5b',
  '#a8e6cf',
  '#dcedc1'
];

export const STOCK_LIST = [
  { code: '600519', name: '贵州茅台', basePrice: 1688.00 },
  { code: '000858', name: '五粮液', basePrice: 156.80 },
  { code: '601318', name: '中国平安', basePrice: 45.60 },
  { code: '000333', name: '美的集团', basePrice: 62.40 },
  { code: '600036', name: '招商银行', basePrice: 34.80 },
  { code: '002594', name: '比亚迪', basePrice: 268.00 },
  { code: '601899', name: '紫金矿业', basePrice: 15.20 },
  { code: '300750', name: '宁德时代', basePrice: 198.50 }
];

export const CONFIG = {
  MAX_DATA_POINTS: 5000,
  PUSH_INTERVAL: 10,
  POINTS_PER_PUSH: 1,
  VISIBLE_POINTS: 500,
  GRID_SPACING: 50,
  CHART_HEIGHT_RATIO: 0.7,
  TIME_AXIS_HEIGHT: 40,
  ANIMATION_DURATION_LINE: 500,
  ANIMATION_DURATION_TRANSITION: 300,
  ANIMATION_DURATION_TOOLTIP: 200,
  ANIMATION_DURATION_PRICE: 300,
  VOLATILITY: 0.002,
  TREND_STRENGTH: 0.0005
};
