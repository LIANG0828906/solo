import type { Schedule, Recommendation } from '@/shared/types';

const API_BASE = '';

export async function fetchSchedules(): Promise<Schedule[]> {
  const res = await fetch(`${API_BASE}/api/schedules`);
  if (!res.ok) throw new Error(`Failed to fetch schedules: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function createSchedule(schedule: Omit<Schedule, 'id'>): Promise<Schedule> {
  const res = await fetch(`${API_BASE}/api/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedule),
  });
  if (!res.ok) throw new Error(`Failed to create schedule: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function deleteSchedule(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/schedules/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete schedule: ${res.status}`);
}

export async function recommendTimes(
  params: { participantIds: string[]; duration: number; users: { id: string; name: string; city: string; utcOffset: number; workStart: string; workEnd: string }[] }
): Promise<Recommendation[]> {
  const res = await fetch(`${API_BASE}/api/schedules/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to get recommendations: ${res.status}`);
  const json = await res.json();
  return json.data;
}
