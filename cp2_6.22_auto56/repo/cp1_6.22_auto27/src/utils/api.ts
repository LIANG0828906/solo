import type {
  Activity,
  ActivityDetail,
  LotteryResult,
  CreateActivityData,
} from '@/types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json() as Promise<T>;
}

export const api = {
  createActivity(data: CreateActivityData) {
    return request<{
      activity: Activity;
      prizes: unknown[];
      participants: unknown[];
      stats: { totalParticipants: number; uniqueParticipants: number; duplicates: number };
    }>('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getActivities() {
    return request<Activity[]>('/activities');
  },

  getActivityDetail(id: string) {
    return request<ActivityDetail>(`/activities/${id}`);
  },

  drawLottery(activityId: string, prizeId?: string) {
    return request<LotteryResult>('/lottery/draw', {
      method: 'POST',
      body: JSON.stringify({ activityId, prizeId }),
    });
  },

  redrawLottery(resultId: string) {
    return request<LotteryResult>('/lottery/redraw', {
      method: 'POST',
      body: JSON.stringify({ resultId }),
    });
  },

  getResults(activityId: string) {
    return request<LotteryResult[]>(`/results/${activityId}`);
  },

  exportResults(activityId: string) {
    window.open(`${API_BASE}/results/export/${activityId}`, '_blank');
  },
};

export function parseCSV(csv: string): { name: string; phone?: string; email?: string }[] {
  const lines = csv.trim().split('\n');
  const participants: { name: string; phone?: string; email?: string }[] = [];

  lines.forEach((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    if (values[0]) {
      participants.push({
        name: values[0],
        phone: values[1] || undefined,
        email: values[2] || undefined,
      });
    }
  });

  return participants;
}
