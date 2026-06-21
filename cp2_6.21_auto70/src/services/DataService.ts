import axios from 'axios';
import { ResumeData, Template, TEMPLATES } from '@/types/resume';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const DataService = {
  async getTemplates(): Promise<Template[]> {
    try {
      const response = await api.get('/templates');
      return response.data.templates || TEMPLATES;
    } catch (error) {
      console.warn('获取模板列表失败，使用本地模板', error);
      return TEMPLATES;
    }
  },

  async saveResume(data: ResumeData): Promise<{ success: boolean; id?: string }> {
    try {
      const response = await api.post('/resume/save', data);
      return response.data;
    } catch (error) {
      console.warn('保存简历失败', error);
      return { success: false };
    }
  },

  async exportResume(data: ResumeData): Promise<Blob> {
    const response = await api.post('/resume/export', data, {
      responseType: 'blob',
    });
    return response.data;
  },

  async checkBackendHealth(): Promise<boolean> {
    try {
      await api.get('/health', { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  },
};
