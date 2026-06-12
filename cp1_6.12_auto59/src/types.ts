export interface Pet {
  id: string;
  name: string;
  breed: string;
  avatar: string;
  age: number;
  weight: number;
  todayMedications?: MedicationLog[];
  activePlans?: number;
}

export interface MedicationPlan {
  id: string;
  petId: string;
  drugName: string;
  dosage: string;
  timesPerDay: number;
  startDate: string;
  endDate: string;
  notes: string;
}

export interface MedicationLog {
  id: string;
  petId: string;
  planId: string;
  drugName: string;
  dosage: string;
  scheduledTime: string;
  actualTime: string | null;
  status: 'pending' | 'completed' | 'skipped';
}

export interface PetDetailResponse {
  pet: Pet;
  plans: MedicationPlan[];
  logs: MedicationLog[];
}

export interface DailyStat {
  date: string;
  dayName: string;
  completed: number;
  total: number;
  rate: number;
}

export interface StatsResponse {
  dailyStats: DailyStat[];
  overallRate: number;
  totalCompleted: number;
  totalScheduled: number;
}
