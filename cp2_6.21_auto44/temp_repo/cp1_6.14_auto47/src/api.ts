import axios from 'axios';
import { PresetData, ClimateParams, ApiResponse } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const fetchPresets = async (): Promise<PresetData[]> => {
  try {
    const response = await api.get<ApiResponse<PresetData[]>>('/presets');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch presets:', error);
    throw error;
  }
};

export const fetchClimates = async (): Promise<ClimateParams[]> => {
  try {
    const response = await api.get<ApiResponse<ClimateParams[]>>('/climates');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch climates:', error);
    throw error;
  }
};

export const fetchPresetById = async (id: string): Promise<PresetData> => {
  try {
    const response = await api.get<ApiResponse<PresetData>>(`/presets/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch preset:', error);
    throw error;
  }
};
