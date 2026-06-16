export type RoastLevel = '浅' | '中浅' | '中' | '中深' | '深';
export type ConcentrationTag = '浓萃' | '均衡' | '淡雅';

export interface BrewRecord {
  id: string;
  date: string;
  bean: string;
  roast: RoastLevel;
  grind: number;
  temp: number;
  method: string;
  duration: string;
  coffeeWeight: number;
  waterWeight: number;
  rating: number;
  concentrationTag: ConcentrationTag;
  createdAt: number;
}

export interface StatsData {
  totalRecords: number;
  avgRating: number;
  mostUsedBean: string;
  last30Days: Array<{
    date: string;
    count: number;
    avgRating: number;
  }>;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}
