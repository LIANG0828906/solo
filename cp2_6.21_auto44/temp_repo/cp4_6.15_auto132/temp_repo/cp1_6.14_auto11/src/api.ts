import axios from 'axios';
import type { Plant, Task, CompletionRate, CareRules, PlantStatus } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const plantApi = {
  getAll: () => api.get<Plant[]>('/plants').then((r) => r.data),
  getById: (id: string) => api.get<Plant>(`/plants/${id}`).then((r) => r.data),
  create: (data: {
    name: string;
    species: string;
    plantDate: number;
    status: PlantStatus;
    careRules: CareRules;
    photo?: string;
  }) => api.post<Plant>('/plants', data).then((r) => r.data),
  update: (id: string, data: Partial<Plant>) =>
    api.put<Plant>(`/plants/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/plants/${id}`).then((r) => r.data),
  uploadPhoto: (plantId: string, file: Blob) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api
      .post<{ url: string; id: string; timestamp: number }>(
        `/plants/${plantId}/photo`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      .then((r) => r.data);
  },
  exportReport: (id: string) =>
    api.get(`/plants/${id}/report`, { responseType: 'blob' }).then((r) => r.data),
};

export const taskApi = {
  getWeekTasks: () => api.get<Task[]>('/tasks/week').then((r) => r.data),
  markComplete: (taskId: string) =>
    api.post(`/tasks/${taskId}/complete`).then((r) => r.data),
  postpone: (taskId: string, days: number) =>
    api.post(`/tasks/${taskId}/postpone`, { days }).then((r) => r.data),
};

export const statsApi = {
  getCompletionRates: () =>
    api.get<CompletionRate[]>('/stats/completion-rates').then((r) => r.data),
};

export const rulesApi = {
  getDefaults: (species: string, status: PlantStatus) =>
    api
      .get<CareRules>(`/rules/defaults`, { params: { species, status } })
      .then((r) => r.data),
};

export default api;
