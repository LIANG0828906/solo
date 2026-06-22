import axios from 'axios';
import { Draft, ScheduledItem } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000
});

export const draftsApi = {
  getAll: () => api.get<Draft[]>('/drafts').then((r) => r.data),
  create: (data: Partial<Draft>) =>
    api.post<Draft>('/drafts', data).then((r) => r.data),
  update: (id: string, data: Partial<Draft>) =>
    api.put<Draft>(`/drafts/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/drafts/${id}`).then((r) => r.data),
  batchImport: (items: Array<Partial<Draft>>) =>
    api
      .post<{ imported: number; drafts: Draft[] }>('/drafts/batch', items)
      .then((r) => r.data)
};

export const scheduleApi = {
  getAll: () =>
    api
      .get<Record<string, Array<ScheduledItem & { draft: Draft }>>>('/schedule')
      .then((r) => r.data),
  create: (data: { draftId: string; date: string; timeSlot?: string }) =>
    api
      .post<ScheduledItem & { draft: Draft }>('/schedule', data)
      .then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/schedule/${id}`).then((r) => r.data)
};

export const recommendApi = {
  getForDate: (date: string) =>
    api
      .get<{
        date: string;
        count: number;
        recommendations: Record<string, string>;
        isOverloaded: boolean;
      }>(`/recommend/${date}`)
      .then((r) => r.data)
};
