import type { Work } from '@/types';

const API_BASE = '/api';

export async function fetchWorks(): Promise<Work[]> {
  const res = await fetch(`${API_BASE}/works`);
  if (!res.ok) throw new Error('Failed to fetch works');
  return res.json();
}

export async function fetchWorkById(id: string): Promise<Work> {
  const res = await fetch(`${API_BASE}/works/${id}`);
  if (!res.ok) throw new Error('Failed to fetch work');
  return res.json();
}
