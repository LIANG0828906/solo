import type { DashboardStats } from '@/types';
import { simulateDelay } from '@/utils/delay';

const API_BASE = '/api';

export const statsApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    await simulateDelay();
    const response = await fetch(`${API_BASE}/stats/dashboard`);
    if (!response.ok) throw new Error('获取统计数据失败');
    return response.json();
  },
};
