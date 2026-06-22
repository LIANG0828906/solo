import axios from 'axios';
import type { User, PreferenceRecord, UserPreferences } from '@/types';

const api = axios.create({ baseURL: '/api', timeout: 5000 });

export async function getUsers(): Promise<User[]> {
  const res = await api.get<{ users: User[] }>('/users');
  return res.data.users;
}

export async function getPreferences(): Promise<PreferenceRecord[]> {
  const res = await api.get<{ preferences: PreferenceRecord[] }>('/api/preferences');
  return res.data.preferences;
}

export async function submitPreference(params: {
  userId: string;
  seatX?: number;
  seatY?: number;
  preferences: UserPreferences;
}): Promise<PreferenceRecord> {
  const res = await api.post<{ success: boolean; record: PreferenceRecord }>(
    '/preferences',
    params,
  );
  return res.data.record;
}
