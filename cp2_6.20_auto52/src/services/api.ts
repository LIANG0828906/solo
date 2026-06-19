import axios from 'axios';
import type { DesktopLayout, OrganizeSuggestion } from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface GetLayoutResponse {
  success: boolean;
  data: DesktopLayout;
  syncedAt: number;
}

export const apiService = {
  async getLayout(): Promise<ApiResponse<DesktopLayout>> {
    try {
      const response = await api.get<GetLayoutResponse>('/desktop/layout');
      return response.data;
    } catch (e) {
      return { success: false, message: 'Failed to fetch layout' };
    }
  },

  async saveLayout(layout: DesktopLayout): Promise<ApiResponse<{ syncedAt: number }>> {
    try {
      const response = await api.post('/desktop/layout', { layout });
      return response.data;
    } catch (e) {
      return { success: false, message: 'Failed to save layout' };
    }
  },

  async getOrganizeRules(): Promise<ApiResponse<{ categories: Array<{ name: string; extensions: string[]; keywords: string[] }> }>> {
    try {
      const response = await api.get('/organizer/rules');
      return response.data;
    } catch (e) {
      return { success: false, message: 'Failed to fetch rules' };
    }
  },

  async login(username: string, password: string): Promise<ApiResponse<{ token: string; user: { id: string; username: string } }>> {
    try {
      const response = await api.post('/auth/login', { username, password });
      return response.data;
    } catch (e) {
      return { success: false, message: 'Login failed' };
    }
  },

  setToken(token: string): void {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  clearToken(): void {
    delete api.defaults.headers.common['Authorization'];
  },
};

export default apiService;
