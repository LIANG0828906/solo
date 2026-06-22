export type HealthStatus = 'healthy' | 'mild' | 'severe';

export interface CatMetrics {
  appetite: number;
  energy: number;
  friendliness: number;
  cleanliness: number;
  health: number;
}

export interface Cat {
  id: string;
  name: string;
  breed: string;
  color: string;
  healthStatus: HealthStatus;
  story: string;
  metrics: CatMetrics;
  behaviorRecords: string[];
  avatar: string;
  arrivalDate: string;
  area: 'reception' | 'checkup' | 'shelter' | 'adoption';
  isExamining?: boolean;
  examProgress?: number;
}

export interface ShelterStats {
  totalCats: number;
  healthyCats: number;
  mildCats: number;
  severeCats: number;
  adoptedCats: number;
  pendingExams: number;
}

export interface User {
  id: string;
  username: string;
}
