import type { Diary, CreateDiaryRequest } from '@/types';

const BASE_URL = '/api';

export const apiClient = {
  async getDiaries(): Promise<Diary[]> {
    const response = await fetch(`${BASE_URL}/diaries`);
    if (!response.ok) {
      throw new Error('Failed to fetch diaries');
    }
    return response.json();
  },

  async getDiary(id: string): Promise<Diary> {
    const response = await fetch(`${BASE_URL}/diaries/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch diary');
    }
    return response.json();
  },

  async createDiary(data: CreateDiaryRequest): Promise<Diary> {
    const response = await fetch(`${BASE_URL}/diaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create diary');
    }
    return response.json();
  },

  async deleteDiary(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${BASE_URL}/diaries/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete diary');
    }
    return response.json();
  },
};
