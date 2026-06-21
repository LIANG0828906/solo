import { apiClient } from './client';
import type { Skill } from '@/types';

export interface FetchSkillsParams {
  search?: string;
  category?: string;
}

export interface CreateSkillData {
  name: string;
  description: string;
  category: string;
  teacherId: string;
}

export async function fetchSkills(params?: FetchSkillsParams): Promise<Skill[]> {
  const response = await apiClient.get<Skill[]>('/skills', { params });
  return response.data;
}

export async function createSkill(data: CreateSkillData): Promise<Skill> {
  const response = await apiClient.post<Skill>('/skills', data);
  return response.data;
}
