export interface StockHolding {
  id: string;
  code: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
}

export interface KLineData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

export interface StockComputed extends StockHolding {
  cost: number;
  marketValue: number;
  profit: number;
  profitPercent: number;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  key: keyof StockComputed | null;
  direction: SortDirection;
}
