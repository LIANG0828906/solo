import axios from 'axios';
import { Fabric } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAuthHeaders = () => {
  const userId = localStorage.getItem('userId');
  return userId ? { 'X-User-Id': userId } : {};
};

export const fetchFabrics = async (): Promise<Fabric[]> => {
  const response = await api.get('/fabrics');
  return response.data;
};

export const fetchFabricById = async (id: number): Promise<Fabric> => {
  const response = await api.get(`/fabrics/${id}`);
  return response.data;
};

export const createFabric = async (data: Omit<Fabric, 'id' | 'createdAt'>): Promise<Fabric> => {
  const response = await api.post('/fabrics', data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateFabric = async (
  id: number,
  data: Partial<Omit<Fabric, 'id' | 'createdAt'>>
): Promise<Fabric> => {
  const response = await api.put(`/fabrics/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteFabricApi = async (id: number): Promise<void> => {
  await api.delete(`/fabrics/${id}`, {
    headers: getAuthHeaders(),
  });
};
