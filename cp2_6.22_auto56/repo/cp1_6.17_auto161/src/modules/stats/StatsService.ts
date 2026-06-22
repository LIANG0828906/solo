import { BrewingRecord, FlavorRating, FLAVOR_LABELS } from '../brewing/BrewingService';

export interface ExtractionTrendPoint {
  date: string;
  萃取率: number;
}

export interface FlavorDistPoint {
  flavor: string;
  平均: number;
}

export interface UserStats {
  totalRecords: number;
  avgExtraction: number;
  extractionTrend: ExtractionTrendPoint[];
  flavorDist: FlavorDistPoint[];
  roastCount: { [key: string]: number };
}

const API_BASE = '/api';

export const fetchUserStats = async (
  userId: string = 'user1',
  days: number = 30
): Promise<UserStats> => {
  const params = new URLSearchParams();
  params.set('userId', userId);
  params.set('days', String(days));
  const res = await fetch(`${API_BASE}/stats?${params.toString()}`);
  if (!res.ok) throw new Error('获取统计数据失败');
  return res.json();
};

export const calculateAvgExtraction = (records: BrewingRecord[]): number => {
  if (records.length === 0) return 0;
  const sum = records.reduce((acc, r) => acc + r.extractionRate, 0);
  return Math.round((sum / records.length) * 100) / 100;
};

export const calculateFlavorDistribution = (records: BrewingRecord[]): FlavorDistPoint[] => {
  if (records.length === 0) {
    return FLAVOR_LABELS.map(label => ({ flavor: label, 平均: 0 }));
  }
  return FLAVOR_LABELS.map(label => {
    const total = records.reduce((sum, r) => {
      const flavor = r.flavor as FlavorRating | undefined;
      return sum + (flavor?.[label as keyof FlavorRating] || 0);
    }, 0);
    return {
      flavor: label,
      平均: Math.round((total / records.length) * 100) / 100,
    };
  });
};

export const groupByDate = (records: BrewingRecord[]): ExtractionTrendPoint[] => {
  const dateMap: { [date: string]: { sum: number; count: number } } = {};
  records.forEach(r => {
    const dateStr = r.createdAt?.split('T')[0] || '';
    if (!dateStr) return;
    if (!dateMap[dateStr]) {
      dateMap[dateStr] = { sum: 0, count: 0 };
    }
    dateMap[dateStr].sum += r.extractionRate;
    dateMap[dateStr].count += 1;
  });
  return Object.keys(dateMap).sort().map(date => ({
    date,
    萃取率: Math.round((dateMap[date].sum / dateMap[date].count) * 100) / 100,
  }));
};

export const getExtractionAdvice = (rate: number): string => {
  if (rate < 18) return '萃取率偏低，建议延长萃取时间或调细研磨度';
  if (rate > 22) return '萃取率偏高，建议缩短萃取时间或调粗研磨度';
  return '萃取率处于理想区间 (18%-22%)';
};
