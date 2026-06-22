import axios from 'axios';
import type { PlanetBasic, PlanetDetail, ApiResponse } from '../types/planet';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export async function fetchPlanets(): Promise<PlanetBasic[]> {
  const response = await api.get<ApiResponse<PlanetBasic[]>>('/planets');
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch planets');
}

export async function fetchPlanetDetail(id: string): Promise<PlanetDetail> {
  const response = await api.get<ApiResponse<PlanetDetail>>(`/planets/${id}`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || `Failed to fetch planet ${id}`);
}
