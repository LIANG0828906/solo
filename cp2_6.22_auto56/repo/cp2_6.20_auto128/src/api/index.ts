import axios from 'axios';
import type { Club, ClubListQuery, ApplyRequest, UserApplication, Activity } from '../types';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

export const clubApi = {
  list: (params?: ClubListQuery): Promise<Club[]> =>
    request.get('/clubs', { params }),

  detail: (id: number): Promise<Club> =>
    request.get(`/clubs/${id}`),

  apply: (id: number, data: ApplyRequest): Promise<{ status: string; message: string }> =>
    request.post(`/clubs/${id}/apply`, data),

  activities: (id: number, page: number, pageSize: number): Promise<{ data: Activity[]; total: number }> =>
    request.get(`/clubs/${id}/activities`, { params: { page, pageSize } }),
};

export const userApi = {
  applications: (): Promise<UserApplication[]> =>
    request.get('/user/applications'),
};
