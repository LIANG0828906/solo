import type {
  Volunteer,
  Project,
  Task,
  TaskClaim,
  Transaction,
} from '@/types';

export interface AppData {
  volunteers: Volunteer[];
  projects: Project[];
  tasks: Task[];
  taskClaims: TaskClaim[];
  transactions: Transaction[];
  currentVolunteerId: string | null;
  _initialized?: boolean;
}

const STORAGE_KEY = 'timegift_app_data';

export function getStoreData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppData;
    return parsed;
  } catch {
    return null;
  }
}

export function setStoreData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}
