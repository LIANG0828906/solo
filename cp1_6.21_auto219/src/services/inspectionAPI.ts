import axios from 'axios';
import type { Inspection } from '@/types';

const BASE_URL = '/api/inspections';

export interface CreateInspectionPayload {
  deviceId: string;
  deviceName: string;
  userId: string;
  items: string[];
  abnormalItems: string[];
  description: string;
  photos: File[];
  onUploadProgress?: (progressEvent: any) => void;
}

export const inspectionAPI = {
  async list(params?: {
    deviceId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<Inspection[]> {
    const res = await axios.get(BASE_URL, { params });
    return res.data;
  },

  async get(id: string): Promise<Inspection> {
    const res = await axios.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  async create(payload: CreateInspectionPayload): Promise<Inspection> {
    const formData = new FormData();
    formData.append('deviceId', payload.deviceId);
    formData.append('deviceName', payload.deviceName);
    formData.append('userId', payload.userId);
    formData.append('items', JSON.stringify(payload.items));
    formData.append('abnormalItems', JSON.stringify(payload.abnormalItems));
    formData.append('description', payload.description);
    payload.photos.forEach((photo) => {
      formData.append('photos', photo);
    });

    const res = await axios.post(BASE_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: payload.onUploadProgress,
    });
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`${BASE_URL}/${id}`);
  },
};

export const deviceAPI = {
  async list(search?: string) {
    const res = await axios.get('/api/devices', { params: { search } });
    return res.data;
  },
};

export const userAPI = {
  async list() {
    const res = await axios.get('/api/users');
    return res.data;
  },
};
