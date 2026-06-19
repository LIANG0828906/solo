import axios from 'axios';
import type { Resume } from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const resumeService = {
  async getAll(): Promise<Resume[]> {
    const { data } = await api.get<Resume[]>('/resumes');
    return data;
  },

  async getById(id: string): Promise<Resume> {
    const { data } = await api.get<Resume>(`/resumes/${id}`);
    return data;
  },

  async create(resume: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resume> {
    const { data } = await api.post<Resume>('/resumes', resume);
    return data;
  },

  async update(id: string, resume: Partial<Resume>): Promise<Resume> {
    const { data } = await api.put<Resume>(`/resumes/${id}`, resume);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/resumes/${id}`);
  },
};
