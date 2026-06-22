import axios from 'axios';

const API_BASE = '/api/presets';

export interface PresetParams {
  density: number;
  speed: number;
  hue: number;
  opacity: number;
}

export interface Preset {
  id: string;
  name: string;
  params: PresetParams;
  createdAt: string;
}

export async function fetchPresets(): Promise<Preset[]> {
  const res = await axios.get<Preset[]>(API_BASE);
  return res.data;
}

export async function savePreset(name: string, params: PresetParams): Promise<Preset> {
  const res = await axios.post<Preset>(API_BASE, { name, params });
  return res.data;
}

export async function updatePreset(id: string, name: string, params: PresetParams): Promise<Preset> {
  const res = await axios.put<Preset>(`${API_BASE}/${id}`, { name, params });
  return res.data;
}

export async function deletePreset(id: string): Promise<Preset> {
  const res = await axios.delete<Preset>(`${API_BASE}/${id}`);
  return res.data;
}
