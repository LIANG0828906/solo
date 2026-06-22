export interface FactorWeights {
  momentum: number;
  value: number;
  volatility: number;
}

export interface Strategy {
  id: string;
  name: string;
  benchmark: string;
  targets: string[];
  factorWeights: FactorWeights;
  favorite: boolean;
  createdAt: number;
}

export interface BacktestResult {
  id: string;
  strategyId: string;
  strategyName: string;
  annualReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  tradeCount: number;
  totalReturn: number;
  finalCapital: number;
  history: { date: string; value: number }[];
}

export interface BacktestRequest {
  strategyId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
}
