import { LoginRequest, LoginResponse, ReviewRequest, FeedbackResponse, Submission } from '@/types';

const API_BASE = '/api';

export const ApiService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('登录失败');
    }
    return response.json();
  },

  async sendReview(data: ReviewRequest): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('提交评分失败');
    }
    return response.json();
  },

  async getFeedback(userId: string, roomId: string): Promise<FeedbackResponse> {
    const response = await fetch(`${API_BASE}/feedback?userId=${userId}&roomId=${roomId}`);
    if (!response.ok) {
      throw new Error('获取反馈数据失败');
    }
    return response.json();
  },

  async getSubmissions(userId: string, roomId: string): Promise<Submission[]> {
    const response = await fetch(`${API_BASE}/submissions?userId=${userId}&roomId=${roomId}`);
    if (!response.ok) {
      throw new Error('获取作业列表失败');
    }
    return response.json();
  },

  async generateRoomCode(): Promise<string> {
    const response = await fetch(`${API_BASE}/generate-code`);
    if (!response.ok) {
      throw new Error('生成房间码失败');
    }
    const data = await response.json();
    return data.code;
  },
};