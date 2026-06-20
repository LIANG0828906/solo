import axios from 'axios';
import type { Event, CheckInRecord, CreateEventData, DashboardStats } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const eventAPI = {
  create: async (data: CreateEventData) => {
    const response = await api.post<Event>('/events', data);
    return response.data;
  },

  list: async (page: number = 1, pageSize: number = 20, status?: string, keyword?: string) => {
    const params: Record<string, string | number> = { page, pageSize };
    if (status) params.status = status;
    if (keyword) params.keyword = keyword;
    const response = await api.get<{ events: Event[]; total: number; hasMore: boolean }>('/events', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Event & { participants: CheckInRecord[] }>(`/events/${id}`);
    return response.data;
  },

  getQRCode: async (id: string) => {
    const response = await api.get<{ code: string; qrCode: string }>(`/events/${id}/qrcode`);
    return response.data;
  },
};

export const checkInAPI = {
  submit: async (eventCode: string, participantName: string) => {
    const response = await api.post<CheckInRecord & { alreadyChecked: boolean; message?: string }>('/checkins', {
      eventCode,
      participantName,
    });
    return response.data;
  },

  list: async (eventId?: string, limit: number = 10) => {
    const params: Record<string, string | number> = {};
    if (eventId) params.eventId = eventId;
    if (limit) params.limit = limit;
    const response = await api.get<CheckInRecord[]>('/checkins', { params });
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get<DashboardStats>('/checkins/dashboard');
    return response.data;
  },
};
