import axios from 'axios';
import type { TimePreset } from '../types';

const api = axios.create({
  baseURL: '',
  timeout: 5000
});

export async function saveTimePreset(
  time: number,
  name?: string
): Promise<TimePreset> {
  const response = await api.post<TimePreset>('/post/time-preset', {
    time,
    name
  });
  return response.data;
}

export async function getTimePresets(): Promise<TimePreset[]> {
  const response = await api.get<{ data: TimePreset[] }>('/get/time-presets');
  return response.data.data;
}
