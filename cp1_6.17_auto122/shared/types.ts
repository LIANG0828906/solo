export type CropType = 'tomato' | 'lettuce' | 'carrot' | 'strawberry';

export interface WaterLog {
  id: string;
  timestamp: number;
  amount: number;
}

export interface Garden {
  id: string;
  claimed: boolean;
  ownerName?: string;
  cropType?: CropType;
  plantedAt?: number;
  waterLogs: WaterLog[];
  expectedHarvestAt?: number;
  progress: number;
  harvested: boolean;
}

export interface ClaimGardenRequest {
  ownerName: string;
  cropType: CropType;
}

export interface AddWaterLogRequest {
  amount: number;
}

export interface WeeklyWaterData {
  week: string;
  count: number;
}

export interface CarbonData {
  date: string;
  kg: number;
}

export interface MonthlyReport {
  totalWaterCount: number;
  totalPlantingDays: number;
  matureCrops: number;
}
