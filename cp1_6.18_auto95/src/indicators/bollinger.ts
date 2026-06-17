import { IndicatorResult, SignalType, CandleData } from '../services/types';

export interface BollingerResult {
  middle: number | null;
  upper: number | null;
  lower: number | null;
  bandwidth: number | null;
  positionPercent: number | null;
  signal: SignalType;
}

function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const sum = slice.reduce((acc, price) => acc + price, 0);
  return sum / period;
}

function calculateStdDev(prices: number[], period: number, mean: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const squaredDiffs = slice.map((price) => Math.pow(price - mean, 2));
  const variance = squaredDiffs.reduce((acc, diff) => acc + diff, 0) / period;
  return Math.sqrt(variance);
}

export function calculateBollingerBands(
  candles: CandleData[],
  period: number = 20,
  multiplier: number = 2
): BollingerResult {
  if (!candles || candles.length === 0) {
    return {
      middle: null,
      upper: null,
      lower: null,
      bandwidth: null,
      positionPercent: null,
      signal: 'HOLD',
    };
  }

  const closes = candles.filter((c) => c && c.close != null).map((c) => c.close);

  const middle = calculateSMA(closes, period);

  if (middle === null) {
    return {
      middle: null,
      upper: null,
      lower: null,
      bandwidth: null,
      positionPercent: null,
      signal: 'HOLD',
    };
  }

  const stdDev = calculateStdDev(closes, period, middle);

  if (stdDev === null) {
    return {
      middle,
      upper: null,
      lower: null,
      bandwidth: null,
      positionPercent: null,
      signal: 'HOLD',
    };
  }

  const upper = middle + multiplier * stdDev;
  const lower = middle - multiplier * stdDev;
  const bandwidth = upper - lower;
  const currentPrice = closes[closes.length - 1];

  let positionPercent: number | null = null;
  if (bandwidth > 0) {
    positionPercent = ((currentPrice - lower) / bandwidth) * 100;
  }

  let signal: SignalType = 'HOLD';
  if (positionPercent !== null) {
    if (positionPercent > 100) {
      signal = 'SELL';
    } else if (positionPercent < 0) {
      signal = 'BUY';
    }
  }

  return {
    middle,
    upper,
    lower,
    bandwidth,
    positionPercent,
    signal,
  };
}

export function getBollingerIndicatorResult(candles: CandleData[]): IndicatorResult {
  const result = calculateBollingerBands(candles, 20, 2);
  const timestamp = candles.length > 0 ? candles[candles.length - 1].timestamp : Date.now();

  return {
    name: 'BollingerBands',
    value: {
      middle: result.middle ?? 0,
      upper: result.upper ?? 0,
      lower: result.lower ?? 0,
      bandwidth: result.bandwidth ?? 0,
      positionPercent: result.positionPercent ?? 50,
    },
    signal: result.signal,
    timestamp,
  };
}
