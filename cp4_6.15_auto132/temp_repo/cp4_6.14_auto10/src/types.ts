export type ActivityCategory = 'transport' | 'diet' | 'energy';

export type TransportType = 'walk' | 'subway' | 'bus' | 'car' | 'flight';
export type DietType = 'meat' | 'vegetable' | 'grain';
export type EnergyType = 'electricity' | 'gas';

export interface Activity {
  id: string;
  category: ActivityCategory;
  subType: TransportType | DietType | EnergyType;
  amount: number;
  unit: string;
  date: string;
  timestamp: number;
}

export interface EmissionFactor {
  category: ActivityCategory;
  subType: TransportType | DietType | EnergyType;
  factor: number;
  unit: string;
  name: string;
  description: string;
}

export interface CategoryBreakdown {
  category: ActivityCategory;
  categoryName: string;
  total: number;
  subItems: SubItemDetail[];
}

export interface SubItemDetail {
  subType: string;
  subTypeName: string;
  amount: number;
  emission: number;
  description: string;
  activityId: string;
}

export interface CarbonResult {
  totalEmission: number;
  breakdown: CategoryBreakdown[];
  activities: Activity[];
}

export interface MonthlyData {
  month: string;
  total: number;
  transport: number;
  diet: number;
  energy: number;
}

export type PageType = 'input' | 'history' | 'monthly';
