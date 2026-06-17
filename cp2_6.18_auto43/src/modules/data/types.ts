export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
}

export interface HealthMetrics {
  systolic?: number;
  diastolic?: number;
  bloodSugar?: number;
}

export interface HealthRecord {
  id: string;
  date: string;
  timestamp: number;
  medication: Medication;
  metrics: HealthMetrics;
  note?: string;
}

export interface WeeklyStats {
  avgBloodPressure: { systolic: number; diastolic: number };
  adherenceRate: number;
  abnormalDays: number;
  totalDoses: number;
}

export interface LineChartPoint {
  date: string;
  systolic?: number;
  diastolic?: number;
  bloodSugar?: number;
}

export interface BarChartItem {
  name: string;
  count: number;
}

export type RangeOption = 7 | 30 | 90;

export const COMMON_MEDICATIONS: string[] = [
  '阿司匹林肠溶片',
  '氨氯地平片',
  '二甲双胍片',
  '缬沙坦胶囊',
  '美托洛尔片',
  '阿托伐他汀钙片',
  '瑞舒伐他汀钙片',
  '格列美脲片',
  '厄贝沙坦片',
  '硝苯地平控释片'
];

export const STORAGE_KEY = 'meditrack_records';
