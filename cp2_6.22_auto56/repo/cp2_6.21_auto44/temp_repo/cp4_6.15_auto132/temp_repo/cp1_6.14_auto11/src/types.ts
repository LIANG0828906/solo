export type PlantStatus = 'seedling' | 'growing' | 'flowering' | 'dormant';

export interface CareRules {
  waterFrequency: number;
  fertilizeFrequency: number;
  lightRequirement: string;
  temperatureMin: number;
  temperatureMax: number;
}

export interface PlantPhoto {
  id: string;
  url: string;
  timestamp: number;
}

export interface CareLog {
  id: string;
  type: 'water' | 'fertilize' | 'repot' | 'note';
  timestamp: number;
  completed: boolean;
  note?: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  plantDate: number;
  status: PlantStatus;
  photo?: PlantPhoto;
  careRules: CareRules;
  nextWaterDate: number;
  nextFertilizeDate: number;
  nextRepotDate: number;
  careLogs: CareLog[];
  notes: string[];
  createdAt: number;
}

export interface Task {
  id: string;
  plantId: string;
  plantName: string;
  type: 'water' | 'fertilize' | 'repot';
  dueDate: number;
  completed: boolean;
  completedAt?: number;
}

export interface CompletionRate {
  date: string;
  total: number;
  completed: number;
  rate: number;
}
