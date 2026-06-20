export interface Ritual {
  id: string;
  name: string;
  type: 'morning' | 'evening';
  isPreset: boolean;
}

export interface CheckIn {
  id: string;
  userId: string;
  ritualId: string;
  ritualName: string;
  ritualType: 'morning' | 'evening';
  date: string;
  time: string;
  createdAt: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
}

export interface CalendarDay {
  date: string;
  count: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
}

export async function createUser(): Promise<{ id: string; createdAt: string }> {
  return request('/api/users', { method: 'POST' });
}

export async function getUser(userId: string): Promise<{ id: string; createdAt: string }> {
  return request(`/api/users/${userId}`);
}

export async function getRituals(type: 'morning' | 'evening'): Promise<Ritual[]> {
  return request(`/api/rituals/${type}`);
}

export async function createRitual(name: string, type: 'morning' | 'evening'): Promise<Ritual> {
  return request('/api/rituals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type }),
  });
}

export async function createCheckIn(data: {
  userId: string;
  ritualId: string;
  ritualName: string;
  ritualType: 'morning' | 'evening';
}): Promise<CheckIn> {
  return request('/api/checkins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function getCheckIns(
  userId: string,
  month?: string,
  page?: number,
  limit?: number,
): Promise<PaginatedResult<CheckIn>> {
  const params = new URLSearchParams();
  if (month) params.set('month', month);
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  const res = await fetch(`/api/checkins/${userId}${qs ? `?${qs}` : ''}`);
  const json = await res.json();
  return { data: json.data, pagination: json.pagination };
}

export async function getStreak(userId: string): Promise<StreakInfo> {
  return request(`/api/checkins/${userId}/streak`);
}

export async function getCalendar(
  userId: string,
  year: number,
  month: number,
): Promise<CalendarDay[]> {
  return request(`/api/checkins/${userId}/calendar/${year}/${month}`);
}

export async function deleteCheckIn(id: string): Promise<void> {
  await request(`/api/checkins/${id}`, { method: 'DELETE' });
}
