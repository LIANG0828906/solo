import { IndicatorResult, SignalType, CandleData } from '../services/types';

export interface RSIResult {
  rsi: number | null;
  signal: SignalType;
}

export function calculateRSI(candles: CandleData[], period: number = 14): RSIResult {
  if (!candles || candles.length < period + 1) {
    return { rsi: null, signal: 'HOLD' };
  }

  const closes = candles.filter((c) => c && c.close != null).map((c) => c.close);
  const changes: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    const change = changes[i];
    if (change > 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) {
    return { rsi: 100, signal: 'SELL' };
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  let signal: SignalType = 'HOLD';
  if (rsi > 70) {
    signal = 'SELL';
  } else if (rsi < 30) {
    signal = 'BUY';
  }

  return { rsi, signal };
}

export function getRSIIndicatorResult(candles: CandleData[]): IndicatorResult {
  const result = calculateRSI(candles, 14);
  const timestamp = candles.length > 0 ? candles[candles.length - 1].timestamp : Date.now();

  return {
    name: 'RSI',
    value: result.rsi ?? 0,
    signal: result.signal,
    timestamp,
  };
}
