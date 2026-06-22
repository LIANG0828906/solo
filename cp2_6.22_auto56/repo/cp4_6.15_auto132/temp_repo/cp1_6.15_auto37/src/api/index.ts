import axios from 'axios';
import type {
  Gig,
  Equipment,
  RehearsalTrack,
  DashboardStats,
  BandMember,
  EquipmentType,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const dashboardApi = {
  getStats: (): Promise<DashboardStats> =>
    api.get('/dashboard').then((res) => res.data),
};

export const gigsApi = {
  getAll: (): Promise<Gig[]> => api.get('/gigs').then((res) => res.data),
  create: (gig: Omit<Gig, 'id'>): Promise<Gig> =>
    api.post('/gigs', gig).then((res) => res.data),
  update: (id: string, gig: Partial<Gig>): Promise<Gig> =>
    api.put(`/gigs/${id}`, gig).then((res) => res.data),
  remove: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/gigs/${id}`).then((res) => res.data),
  reorder: (ids: string[]): Promise<{ success: boolean }> =>
    api.put('/gigs/reorder', { ids }).then((res) => res.data),
};

export const equipmentApi = {
  getAll: (params?: { type?: EquipmentType | 'all'; search?: string }): Promise<Equipment[]> =>
    api.get('/equipment', { params }).then((res) => res.data),
  create: (equipment: Omit<Equipment, 'id'>): Promise<Equipment> =>
    api.post('/equipment', equipment).then((res) => res.data),
  update: (id: string, equipment: Partial<Equipment>): Promise<Equipment> =>
    api.put(`/equipment/${id}`, equipment).then((res) => res.data),
  remove: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/equipment/${id}`).then((res) => res.data),
};

export const rehearsalsApi = {
  getAll: (): Promise<RehearsalTrack[]> =>
    api.get('/rehearsals').then((res) => res.data),
  create: (track: Omit<RehearsalTrack, 'id'>): Promise<RehearsalTrack> =>
    api.post('/rehearsals', track).then((res) => res.data),
  update: (id: string, track: Partial<RehearsalTrack>): Promise<RehearsalTrack> =>
    api.put(`/rehearsals/${id}`, track).then((res) => res.data),
  remove: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/rehearsals/${id}`).then((res) => res.data),
};

export const membersApi = {
  getAll: (): Promise<BandMember[]> =>
    api.get('/members').then((res) => res.data),
};

export default api;
