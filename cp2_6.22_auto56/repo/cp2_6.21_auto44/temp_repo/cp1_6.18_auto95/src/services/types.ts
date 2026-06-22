export interface MarketData {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type SignalType = 'BUY' | 'SELL' | 'HOLD';

export interface IndicatorResult {
  name: string;
  value: number | Record<string, number>;
  signal: SignalType;
  timestamp: number;
}

export interface Trade {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;
  price: number;
  timestamp: number;
  pnl?: number;
}

export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  openTime: number;
}

export interface Portfolio {
  balance: number;
  positions: Position[];
  trades: Trade[];
  totalPnl: number;
}

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
