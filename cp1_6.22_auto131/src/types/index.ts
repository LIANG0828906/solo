export interface MonthlyRecord {
  year: number;
  month: number;
  temperature: number;
  precipitation: number;
}

export interface CityClimate {
  cityId: string;
  cityName: string;
  lat: number;
  lng: number;
  monthlyData: MonthlyRecord[];
}

export interface HoverInfo {
  cityId: string;
  cityName: string;
  month: number;
  temperature: number;
  precipitation: number;
  screenX: number;
  screenY: number;
  visible: boolean;
}

export type ViewMode = 'auto-rotate' | 'free-explore' | 'locked';

export interface GlobalStats {
  avgTemperature: number;
  totalPrecipitation: number;
}
