import Papa from 'papaparse';
import type { DataPoint } from './types';

const DEFAULT_CATEGORIES = ['科技', '金融', '医疗', '能源', '消费'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateMockData(
  timeSteps: number = 50,
  categories: string[] = DEFAULT_CATEGORIES
): DataPoint[][] {
  const random = seededRandom(42);
  const timeSeries: DataPoint[][] = [];
  const pointsPerTime = categories.length * 8;

  for (let t = 0; t < timeSteps; t++) {
    const timeSlice: DataPoint[] = [];
    const date = new Date(2024, 0, 1);
    date.setDate(date.getDate() + t);
    const timeStr = date.toISOString().split('T')[0];

    for (let i = 0; i < pointsPerTime; i++) {
      const category = categories[i % categories.length];
      const baseValue = 20 + (i * 7) % 60;
      const trend = Math.sin((t + i) * 0.15) * 15;
      const noise = (random() - 0.5) * 10;
      const value = Math.max(5, Math.round(baseValue + trend + noise));

      timeSlice.push({
        time: timeStr,
        value,
        category,
        index: i,
      });
    }
    timeSeries.push(timeSlice);
  }

  return timeSeries;
}

export function parseCSV(content: string): DataPoint[][] {
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    throw new Error(`CSV解析错误: ${result.errors[0].message}`);
  }

  const rows = result.data as Array<Record<string, string>>;
  if (rows.length === 0) {
    throw new Error('CSV文件为空');
  }

  const timeMap = new Map<string, DataPoint[]>();

  rows.forEach((row, idx) => {
    const time = row['time'] || row['时间'] || row['Time'] || '';
    const valueStr = row['value'] || row['数值'] || row['Value'] || '0';
    const category = row['category'] || row['类别'] || row['Category'] || '默认';

    const point: DataPoint = {
      time,
      value: parseFloat(valueStr) || 0,
      category,
      index: idx,
    };

    if (!timeMap.has(time)) {
      timeMap.set(time, []);
    }
    timeMap.get(time)!.push(point);
  });

  const sortedTimes = Array.from(timeMap.keys()).sort();
  return sortedTimes.map((time) => {
    const slice = timeMap.get(time)!;
    return slice.map((p, i) => ({ ...p, index: i }));
  });
}
