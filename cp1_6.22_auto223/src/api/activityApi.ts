import type { Activity, Participant, CreateActivityRequest, RegisterRequest, CheckInRequest } from '@/types';
import { simulateDelay } from '@/utils/delay';

const API_BASE = '/api';

export const activityApi = {
  async getActivities(): Promise<Activity[]> {
    await simulateDelay();
    const response = await fetch(`${API_BASE}/activities`);
    if (!response.ok) throw new Error('获取活动列表失败');
    return response.json();
  },

  async getActivity(id: string): Promise<Activity> {
    await simulateDelay();
    const response = await fetch(`${API_BASE}/activities/${id}`);
    if (!response.ok) throw new Error('获取活动详情失败');
    return response.json();
  },

  async createActivity(data: CreateActivityRequest): Promise<Activity> {
    await simulateDelay();
    const response = await fetch(`${API_BASE}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '创建活动失败' }));
      throw new Error(error.error || '创建活动失败');
    }
    return response.json();
  },

  async register(data: RegisterRequest): Promise<Participant> {
    await simulateDelay();
    const response = await fetch(`${API_BASE}/activities/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '报名失败' }));
      throw new Error(error.error || '报名失败');
    }
    return response.json();
  },

  async checkIn(activityId: string, participantId: string): Promise<{ success: boolean; participant: Participant }> {
    await simulateDelay();
    const response = await fetch(`${API_BASE}/activities/${activityId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId } as CheckInRequest),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '签到失败' }));
      throw new Error(error.error || '签到失败');
    }
    return response.json();
  },

  async getParticipants(activityId: string): Promise<Participant[]> {
    await simulateDelay();
    const response = await fetch(`${API_BASE}/activities/${activityId}/participants`);
    if (!response.ok) throw new Error('获取参与者列表失败');
    return response.json();
  },
};
