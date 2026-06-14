import axios from 'axios';
import type {
  Client,
  Exercise,
  TrainingPlan,
  Session,
  WeeklyReport,
  BaselineScores,
  SelfAssessment,
  AdjustRequest,
} from '@/shared/types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error || error.message || '请求失败';
    return Promise.reject(new Error(message));
  },
);

export const clientApi = {
  getClients: () => api.get<Client[]>('/clients').then((r) => r.data),
  getClient: (id: string) => api.get<Client>(`/clients/${id}`).then((r) => r.data),
  createClient: (data: Omit<Client, 'id' | 'createdAt'>) =>
    api.post<Client>('/clients', data).then((r) => r.data),
  updateBaseline: (id: string, baseline: BaselineScores) =>
    api.patch<Client>(`/clients/${id}/baseline`, { baselineScores: baseline }).then((r) => r.data),
};

export const exerciseApi = {
  getExercises: () => api.get<Exercise[]>('/exercises').then((r) => r.data),
  createExercise: (data: Omit<Exercise, 'id'>) =>
    api.post<Exercise>('/exercises', data).then((r) => r.data),
  updateExercise: (id: string, data: Partial<Omit<Exercise, 'id'>>) =>
    api.patch<Exercise>(`/exercises/${id}`, data).then((r) => r.data),
};

export const trainingPlanApi = {
  createPlan: (data: Omit<TrainingPlan, 'id' | 'createdAt'>) =>
    api.post<TrainingPlan>('/training-plans', data).then((r) => r.data),
  getClientPlan: (clientId: string) =>
    api.get<TrainingPlan>(`/training-plans/client/${clientId}`).then((r) => r.data),
  updatePlan: (id: string, data: Partial<Omit<TrainingPlan, 'id' | 'createdAt'>>) =>
    api.patch<TrainingPlan>(`/training-plans/${id}`, data).then((r) => r.data),
  adjustPlan: (id: string, data: AdjustRequest) =>
    api.post<TrainingPlan>(`/training-plans/${id}/adjust`, data).then((r) => r.data),
};

export const sessionApi = {
  recordSession: (data: Omit<Session, 'id'>) =>
    api.post<Session>('/sessions', data).then((r) => r.data),
  submitSelfAssessment: (sessionId: string, data: SelfAssessment) =>
    api.post<Session>(`/sessions/${sessionId}/self-assessment`, data).then((r) => r.data),
  getSession: (id: string) => api.get<Session>(`/sessions/${id}`).then((r) => r.data),
  getTodaySession: (clientId: string) =>
    api.get<Session>(`/sessions/today`, { params: { clientId } }).then((r) => r.data),
};

export const reportApi = {
  getWeeklyReport: (clientId: string, week: string) =>
    api.get<WeeklyReport>(`/reports/${clientId}/${week}`).then((r) => r.data),
  exportReportPdf: (clientId: string, week: string) =>
    api.get<Blob>(`/reports/${clientId}/${week}/pdf`, { responseType: 'blob' }).then((r) => r.data),
};

export default api;
