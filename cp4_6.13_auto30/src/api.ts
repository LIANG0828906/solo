import { Skill, Exchange, User, Review } from './types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || '请求失败');
  }
  return res.json();
}

export async function fetchSkills(category?: string): Promise<Skill[]> {
  const url = category && category !== '全部'
    ? `/api/skills?category=${encodeURIComponent(category)}`
    : '/api/skills';
  const res = await fetch(url);
  return handleResponse<Skill[]>(res);
}

export async function fetchSkillById(id: number): Promise<Skill> {
  const res = await fetch(`/api/skills/${id}`);
  return handleResponse<Skill>(res);
}

export async function createExchange(data: {
  skillId: number;
  fromUserId: number;
  toUserId: number;
  scheduledDate: string;
  startTime: number;
  endTime: number;
}): Promise<Exchange> {
  const res = await fetch('/api/exchanges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Exchange>(res);
}

export async function fetchExchanges(userId: number): Promise<Exchange[]> {
  const res = await fetch(`/api/exchanges?userId=${userId}`);
  return handleResponse<Exchange[]>(res);
}

export async function updateExchangeStatus(id: number, status: Exchange['status']): Promise<Exchange> {
  const res = await fetch(`/api/exchanges/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse<Exchange>(res);
}

export async function fetchSchedule(userId: number, month?: number, year?: number): Promise<Exchange[]> {
  const params = new URLSearchParams({ userId: String(userId) });
  if (month) params.set('month', String(month));
  if (year) params.set('year', String(year));
  const res = await fetch(`/api/schedule?${params.toString()}`);
  return handleResponse<Exchange[]>(res);
}

export async function createReview(data: Omit<Review, 'id' | 'createdAt'>): Promise<void> {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await handleResponse(res);
}

export async function checkReviewed(exchangeId: number, reviewerId: number): Promise<{ reviewed: boolean; review?: Review }> {
  const res = await fetch(`/api/reviews/check?exchangeId=${exchangeId}&reviewerId=${reviewerId}`);
  return handleResponse(res);
}

export async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return handleResponse<User>(res);
}

export async function registerUser(name: string): Promise<User> {
  const res = await fetch('/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse<User>(res);
}
