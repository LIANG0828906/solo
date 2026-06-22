import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export interface LogoParams {
  hue: number;
  rotation: number;
  shapeCount: number;
}

export interface Logo {
  id: string;
  name: string;
  params: LogoParams;
  imageData: string;
  createdAt: string;
  isFavorite: boolean;
}

export interface Preset {
  name: string;
  params: LogoParams;
}

export async function saveLogo(data: {
  name: string;
  params: LogoParams;
  imageData: string;
}): Promise<Logo> {
  const response = await api.post<Logo>('/save', data);
  return response.data;
}

export async function getGallery(): Promise<Logo[]> {
  const response = await api.get<Logo[]>('/gallery');
  return response.data;
}

export async function toggleFavorite(id: string): Promise<Logo> {
  const response = await api.put<Logo>(`/favorite/${id}`);
  return response.data;
}

export async function getPresets(): Promise<Preset[]> {
  const response = await api.get<Preset[]>('/presets');
  return response.data;
}
