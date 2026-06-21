import axios from 'axios';
import type { Settings } from '../../shared/types';

const API_BASE = '/api/settings';

export interface UpdateSettingsData {
  userName?: string;
  hourlyRate?: number;
  logoData?: string;
}

export async function getSettings(): Promise<Settings> {
  const response = await axios.get(API_BASE);
  return response.data.data;
}

export async function updateSettings(data: UpdateSettingsData): Promise<Settings> {
  const response = await axios.put(API_BASE, data);
  return response.data.data;
}
