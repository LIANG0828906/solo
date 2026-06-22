export type ActivityType = 'full_reduction' | 'discount' | 'flash_sale';
export type ActivityStatus = 'upcoming' | 'ongoing' | 'ended';

export interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  budgetLimit: number;
  budgetUsed: number;
  startTime: number;
  endTime: number;
  status: ActivityStatus;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface HourlyData {
  timestamp: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface ClickPoint {
  x: number;
  y: number;
  count: number;
}

export interface ActivityDetail extends Activity {
  hourlyData: HourlyData[];
  heatmapData: ClickPoint[];
}

export interface ActivityCreate {
  name: string;
  type: ActivityType;
  budgetLimit: number;
  startTime: number;
  endTime: number;
}

export interface LineChartOptions {
  width?: number;
  height?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  colors?: {
    impressions: string;
    clicks: string;
    conversions: string;
  };
  showDots?: boolean;
  smooth?: boolean;
}

export interface HeatmapOptions {
  width?: number;
  height?: number;
  radius?: number;
  gradient?: string[];
}

export type FilterType = ActivityType | 'all';
export type FilterStatus = ActivityStatus | 'all';
