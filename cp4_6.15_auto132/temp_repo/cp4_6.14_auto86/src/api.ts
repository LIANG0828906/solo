import axios from 'axios';
import type { Property, CalendarDay, Message, BookingStatus } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export const propertyApi = {
  getAll: () => api.get<Property[]>('/properties').then((res) => res.data),
  create: (data: Omit<Property, 'id' | 'isActive' | 'createdAt'>) =>
    api.post<Property>('/properties', data).then((res) => res.data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/properties/${id}`).then((res) => res.data),
};

export const calendarApi = {
  getRange: (startDate: string, endDate: string) =>
    api.get<CalendarDay[]>('/calendar', { params: { startDate, endDate } }).then((res) => res.data),
  update: (data: { propertyId: string; date: string; status: BookingStatus; guestName?: string }) =>
    api.post<CalendarDay>('/calendar', data).then((res) => res.data),
};

export const messageApi = {
  getAll: (params?: { isReplied?: boolean; search?: string }) =>
    api.get<Message[]>('/messages', { params }).then((res) => res.data),
  reply: (id: string, reply: string) =>
    api.post<Message>(`/messages/${id}/reply`, { reply }).then((res) => res.data),
};
