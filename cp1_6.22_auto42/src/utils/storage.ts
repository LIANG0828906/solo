import type { WorkData } from '@/types';

const STORAGE_KEY = 'lego_works';

export function loadWorks(): WorkData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as WorkData[];
  } catch (err) {
    console.warn('Failed to load works from localStorage:', err);
    return [];
  }
}

export function saveWorks(list: WorkData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to save works to localStorage:', err);
  }
}

export function createWork(
  name: string,
  data: Omit<WorkData, 'id' | 'createdAt'>
): WorkData {
  const work: WorkData = {
    ...data,
    id: generateId(),
    name,
    createdAt: Date.now(),
  };
  const list = loadWorks();
  list.unshift(work);
  saveWorks(list);
  return work;
}

export function deleteWork(id: string): void {
  const list = loadWorks();
  const next = list.filter((w) => w.id !== id);
  saveWorks(next);
}

export function generateId(): string {
  return `brick_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
