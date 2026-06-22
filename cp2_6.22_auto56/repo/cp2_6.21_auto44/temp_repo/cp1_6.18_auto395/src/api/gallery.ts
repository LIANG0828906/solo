import axios from 'axios';
import type { Gallery } from './index';

const api = axios.create({
  baseURL: '/api',
});

export const galleryApi = {
  async getGalleries(): Promise<Gallery[]> {
    const { data } = await api.get('/galleries');
    return data;
  },

  async createGallery(formData: FormData): Promise<Gallery> {
    const { data } = await api.post('/galleries', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getGallery(id: number): Promise<Gallery> {
    const { data } = await api.get(`/galleries/${id}`);
    return data;
  },

  async updateGallery(id: number, data: { name: string; description: string }): Promise<Gallery> {
    const { data: result } = await api.put(`/galleries/${id}`, data);
    return result;
  },

  async deleteGallery(id: number): Promise<{ success: boolean }> {
    const { data } = await api.delete(`/galleries/${id}`);
    return data;
  },
};
