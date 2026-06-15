import type { StockData } from './types';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${mi}`;
}

export function generateMockData(code: string, days: number = 126): StockData[] {
  const seed = hashString(code);
  const rand = seededRandom(seed);
  const data: StockData[] = [];

  const basePrice = 50 + rand() * 200;
  let currentPrice = basePrice;

  const today = new Date();
  const dates: Date[] = [];
  let cursor = new Date(today);
  while (dates.length < days) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  dates.reverse();

  for (let i = 0; i < dates.length; i++) {
    const volatility = 0.015 + rand() * 0.025;
    const drift = (rand() - 0.48) * volatility;
    const open = currentPrice * (1 + (rand() - 0.5) * 0.005);
    const close = open * (1 + drift);
    const high = Math.max(open, close) * (1 + rand() * volatility * 0.6);
    const low = Math.min(open, close) * (1 - rand() * volatility * 0.6);
    const volume = Math.floor(1000000 + rand() * 5000000);

    data.push({
      date: formatDate(dates[i]),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume
    });

    currentPrice = close;
  }

  return data;
}

export function generateMinuteData(baseData: StockData[], days: number = 10): StockData[] {
  const seed = hashString(baseData[0]?.date ?? 'default');
  const rand = seededRandom(seed);
  const result: StockData[] = [];

  const startIdx = Math.max(0, baseData.length - days);
  const selectedDays = baseData.slice(startIdx);

  for (const day of selectedDays) {
    const baseDate = new Date(day.date + 'T09:30:00');
    let currentPrice = day.open;
    const bars = 78;

    for (let i = 0; i < bars; i++) {
      const time = new Date(baseDate.getTime() + i * 5 * 60 * 1000);
      const volatility = 0.003 + rand() * 0.005;
      const drift = (rand() - 0.5) * volatility;
      const open = currentPrice * (1 + (rand() - 0.5) * 0.002);
      const close = open * (1 + drift);
      const high = Math.max(open, close) * (1 + rand() * volatility * 0.5);
      const low = Math.min(open, close) * (1 - rand() * volatility * 0.5);
      const volume = Math.floor(10000 + rand() * 100000);

      result.push({
        date: formatDateTime(time),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume
      });

      currentPrice = close;
    }
  }

  return result;
}

export function calculateMA(data: StockData[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j].close;
      }
      result.push(Number((sum / period).toFixed(2)));
    }
  }
  return result;
}

export function calculateRSI(data: StockData[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (data.length < period + 1) {
    return data.map(() => null);
  }

  const changes: number[] = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i - 1].close);
  }

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    const change = changes[i];
    if (change > 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(null);
    } else {
      const change = changes[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        result.push(Number((100 - 100 / (1 + rs)).toFixed(2)));
      }
    }
  }

  return result;
}

export function filterByIndexRange(
  data: StockData[],
  startIdx: number,
  endIdx: number
): StockData[] {
  const s = Math.max(0, startIdx);
  const e = Math.min(data.length, endIdx);
  return data.slice(s, e);
}
