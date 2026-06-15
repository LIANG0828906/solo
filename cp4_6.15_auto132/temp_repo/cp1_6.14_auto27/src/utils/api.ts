import axios from 'axios';
import type { Project, Chapter, WritingLog } from '../../shared/types';

const client = axios.create({ baseURL: '/api', timeout: 10000 });

export const projectApi = {
  list: () => client.get<Project[]>('/projects').then(r => r.data),
  get: (id: string) => client.get<Project>(`/projects/${id}`).then(r => r.data),
  create: (data: Partial<Project>) => client.post<Project>('/projects', data).then(r => r.data),
  update: (id: string, data: Partial<Project>) => client.put<Project>(`/projects/${id}`, data).then(r => r.data),
  duplicate: (id: string) => client.post<Project>(`/projects/${id}/duplicate`).then(r => r.data),
  remove: (id: string) => client.delete(`/projects/${id}`).then(r => r.data),
  reorder: (ids: string[]) => client.put<Project[]>('/projects/reorder', { ids }).then(r => r.data),
};

export const chapterApi = {
  list: (projectId: string) => client.get<Chapter[]>(`/projects/${projectId}/chapters`).then(r => r.data),
  create: (projectId: string, data: { title: string }) => client.post<Chapter>(`/projects/${projectId}/chapters`, data).then(r => r.data),
  update: (id: string, data: Partial<Chapter>) => client.put<Chapter>(`/chapters/${id}`, data).then(r => r.data),
  remove: (id: string) => client.delete(`/chapters/${id}`).then(r => r.data),
  reorder: (projectId: string, chapterIds: string[]) =>
    client.put<Chapter[]>(`/projects/${projectId}/chapters/reorder`, { chapterIds }).then(r => r.data),
};

export const writingLogApi = {
  create: (data: Partial<WritingLog>) => client.post<WritingLog>('/writing-logs', data).then(r => r.data),
  daily: (projectId: string, days = 7) =>
    client.get<WritingLog[]>(`/writing-logs/${projectId}/daily`, { params: { days } }).then(r => r.data),
  byDate: (projectId: string, date: string) =>
    client.get<WritingLog>(`/writing-logs/${projectId}/date/${date}`).then(r => r.data),
};

export {
  getProjectWordCount,
  setProjectWordCount,
  getDailyWordLog,
  recordDailyWords,
  getSnippetsByDate,
} from './textStats';
