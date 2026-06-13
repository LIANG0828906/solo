import axios from 'axios';
import type { Objective, CreateObjectiveRequest, UpdateObjectiveRequest, CheckInRequest, ApiResponse } from '../../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

export const objectivesApi = {
  getAll: async (): Promise<Objective[]> => {
    const response = await api.get<ApiResponse<Objective[]>>('/objectives');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '获取目标列表失败');
    }
    return response.data.data;
  },

  getById: async (id: string): Promise<Objective> => {
    const response = await api.get<ApiResponse<Objective>>(`/objectives/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '获取目标详情失败');
    }
    return response.data.data;
  },

  create: async (data: CreateObjectiveRequest): Promise<Objective> => {
    const response = await api.post<ApiResponse<Objective>>('/objectives', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '创建目标失败');
    }
    return response.data.data;
  },

  update: async (id: string, data: UpdateObjectiveRequest): Promise<Objective> => {
    const response = await api.put<ApiResponse<Objective>>(`/objectives/${id}`, data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '更新目标失败');
    }
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/objectives/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || '删除目标失败');
    }
  },

  checkIn: async (id: string, data: CheckInRequest): Promise<Objective> => {
    const response = await api.patch<ApiResponse<Objective>>(`/objectives/${id}/checkin`, data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '更新进度失败');
    }
    return response.data.data;
  }
};

export default api;
