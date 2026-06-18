import axios, { AxiosInstance } from 'axios';
import type { Gallery } from './types';

export { Gallery } from './types';

const BASE_URL = 'http://localhost:8000';

export const galleryAxios: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

galleryAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface GalleryCreateData {
  name: string;
  description: string;
  cover_image?: File;
}

export interface GalleryUpdateData {
  name?: string;
  description?: string;
  cover_image?: File;
}

export const galleryApi = {
  axios: galleryAxios,

  getGalleries: async (): Promise<Gallery[]> => {
    const response = await galleryAxios.get<Gallery[]>('/api/galleries');
    return response.data;
  },

  createGallery: async (formData: FormData): Promise<Gallery> => {
    const response = await galleryAxios.post<Gallery>('/api/galleries', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getGallery: async (id: number | string): Promise<Gallery> => {
    const response = await galleryAxios.get<Gallery>(`/api/galleries/${id}`);
    return response.data;
  },

  updateGallery: async (id: number | string, data: GalleryUpdateData | FormData): Promise<Gallery> => {
    const isFormData = data instanceof FormData;
    const response = await galleryAxios.put<Gallery>(`/api/galleries/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  deleteGallery: async (id: number | string): Promise<void> => {
    await galleryAxios.delete(`/api/galleries/${id}`);
  },
};
