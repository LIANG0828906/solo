export type HealthStatus = 'healthy' | 'observation' | 'treatment';

export interface Animal {
  id: string;
  name: string;
  species: string;
  age: number;
  gender: string;
  entryDate: string;
  photoUrl: string;
  healthStatus: HealthStatus;
}

export interface FeedingRecord {
  id: string;
  animalId: string;
  date: string;
  time: string;
  foodType: string;
  quantity: string;
  notes: string;
}

export interface HealthRecord {
  id: string;
  animalId: string;
  date: string;
  type: string;
  handler: string;
  notes: string;
  status: HealthStatus;
}

export interface AnimalDetail extends Animal {
  feedingRecords: FeedingRecord[];
  healthRecords: HealthRecord[];
}

export interface Employee {
  id: string;
  name: string;
  order: number;
}

export type ShiftType = 'morning' | 'afternoon' | 'evening';
export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ScheduleWeek {
  weekStart: string;
  employees: Employee[];
  schedules: Record<string, Record<DayKey, ShiftType | undefined>>;
  days: DayKey[];
  shifts: Record<string, { id: string; name: string; color: string }>;
}
