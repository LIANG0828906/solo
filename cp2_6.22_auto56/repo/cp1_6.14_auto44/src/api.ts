import axios from 'axios';
import type { Family, StorageLocation, InventoryItem, ConsumptionRecord, SupplySuggestion } from './types';

const api = axios.create({ baseURL: '/api' });

export const familyApi = {
  getAll: () => api.get<Family[]>('/families').then(r => r.data),
  create: (data: Pick<Family, 'name' | 'location'>) => api.post<Family>('/families', data).then(r => r.data),
  update: (id: string, data: Partial<Family>) => api.put<Family>(`/families/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/families/${id}`),
};

export const locationApi = {
  getAll: (familyId: string) => api.get<StorageLocation[]>(`/families/${familyId}/locations`).then(r => r.data),
  create: (familyId: string, data: Pick<StorageLocation, 'name' | 'color'>) => api.post<StorageLocation>(`/families/${familyId}/locations`, data).then(r => r.data),
  update: (familyId: string, id: string, data: Partial<StorageLocation>) => api.put<StorageLocation>(`/families/${familyId}/locations/${id}`, data).then(r => r.data),
  delete: (familyId: string, id: string) => api.delete(`/families/${familyId}/locations/${id}`),
};

export const itemApi = {
  getAll: (familyId: string, params?: { locationId?: string; status?: string }) => api.get<InventoryItem[]>(`/families/${familyId}/items`, { params }).then(r => r.data),
  create: (familyId: string, data: Omit<InventoryItem, 'id' | 'processed'>) => api.post<InventoryItem>(`/families/${familyId}/items`, data).then(r => r.data),
  update: (familyId: string, id: string, data: Partial<InventoryItem>) => api.put<InventoryItem>(`/families/${familyId}/items/${id}`, data).then(r => r.data),
  delete: (familyId: string, id: string) => api.delete(`/families/${familyId}/items/${id}`),
  getExpiring: (familyId: string) => api.get<InventoryItem[]>(`/families/${familyId}/expiring`).then(r => r.data),
};

export const suggestionApi = {
  getAll: (familyId: string) => api.get<SupplySuggestion[]>(`/families/${familyId}/suggestions`).then(r => r.data),
  purchase: (familyId: string, itemId: string, quantity: number) => api.post<InventoryItem>(`/families/${familyId}/suggestions/${itemId}/purchase`, { quantity }).then(r => r.data),
};

export const consumptionApi = {
  get: (familyId: string, days: number = 7) => api.get<ConsumptionRecord[]>(`/families/${familyId}/consumption`, { params: { days } }).then(r => r.data),
};
