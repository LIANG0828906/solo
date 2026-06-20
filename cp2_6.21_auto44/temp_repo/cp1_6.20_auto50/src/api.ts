import { Medicine } from './types';

const API_BASE = '/api/medicines';

export const api = {
  async getAll(): Promise<Medicine[]> {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error('获取药品列表失败');
    }
    return response.json();
  },

  async getById(id: string): Promise<Medicine> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) {
      throw new Error('获取药品详情失败');
    }
    return response.json();
  },

  async create(data: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medicine> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '创建药品失败');
    }
    return response.json();
  },

  async update(id: string, data: Partial<Medicine>): Promise<Medicine> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '更新药品失败');
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('删除药品失败');
    }
  },
};
