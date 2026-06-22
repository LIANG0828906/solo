import { IndicatorResult, SignalType, CandleData } from '../services/types';

export interface MAResult {
  ma5: number | null;
  ma20: number | null;
  crossover: SignalType;
  prevMa5: number | null;
  prevMa20: number | null;
}

export function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const sum = slice.reduce((acc, price) => acc + price, 0);
  return sum / period;
}

export function calculateMovingAverage(candles: CandleData[]): MAResult {
  if (!candles || candles.length === 0) {
    return { ma5: null, ma20: null, crossover: 'HOLD', prevMa5: null, prevMa20: null };
  }
  const closes = candles.filter((c) => c && c.close != null).map((c) => c.close);

  const ma5 = calculateSMA(closes, 5);
  const ma20 = calculateSMA(closes, 20);

  let prevMa5: number | null = null;
  let prevMa20: number | null = null;

  if (closes.length >= 6) {
    prevMa5 = calculateSMA(closes.slice(0, -1), 5);
  }
  if (closes.length >= 21) {
    prevMa20 = calculateSMA(closes.slice(0, -1), 20);
  }

  let crossover: SignalType = 'HOLD';

  if (ma5 !== null && ma20 !== null && prevMa5 !== null && prevMa20 !== null) {
    if (prevMa5 <= prevMa20 && ma5 > ma20) {
      crossover = 'BUY';
    } else if (prevMa5 >= prevMa20 && ma5 < ma20) {
      crossover = 'SELL';
    }
  }

  return { ma5, ma20, crossover, prevMa5, prevMa20 };
}

export function getMAIndicatorResult(candles: CandleData[]): IndicatorResult {
  const result = calculateMovingAverage(candles);
  const timestamp = candles.length > 0 ? candles[candles.length - 1].timestamp : Date.now();

  return {
    name: 'MovingAverage',
    value: {
      ma5: result.ma5 ?? 0,
      ma20: result.ma20 ?? 0,
    },
    signal: result.crossover,
    timestamp,
  };
}
