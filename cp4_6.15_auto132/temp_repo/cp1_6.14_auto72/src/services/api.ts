import axios from 'axios';
import type { Cat, ShelterStats } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const catAPI = {
  getAllCats: async (): Promise<Cat[]> => {
    const response = await api.get('/cats');
    return response.data;
  },

  getCatsByArea: async (area: Cat['area']): Promise<Cat[]> => {
    const response = await api.get(`/cats?area=${area}`);
    return response.data;
  },

  getCatById: async (id: string): Promise<Cat> => {
    const response = await api.get(`/cats/${id}`);
    return response.data;
  },

  createCat: async (cat: Omit<Cat, 'id'>): Promise<Cat> => {
    const response = await api.post('/cats', cat);
    return response.data;
  },

  updateCat: async (id: string, data: Partial<Cat>): Promise<Cat> => {
    const response = await api.put(`/cats/${id}`, data);
    return response.data;
  },

  deleteCat: async (id: string): Promise<void> => {
    await api.delete(`/cats/${id}`);
  },

  generateRandomCat: async (): Promise<Cat> => {
    const response = await api.post('/cats/generate');
    return response.data;
  },

  startExam: async (id: string): Promise<Cat> => {
    const response = await api.post(`/cats/${id}/exam`);
    return response.data;
  },

  completeExam: async (id: string): Promise<Cat> => {
    const response = await api.post(`/cats/${id}/exam/complete`);
    return response.data;
  },
};

export const statsAPI = {
  getStats: async (): Promise<ShelterStats> => {
    const response = await api.get('/stats');
    return response.data;
  },
};

export default api;
