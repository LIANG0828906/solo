import type { Comment, CreateCommentRequest, LikeResponse, LikeRequest } from '@/types';
import { simulateDelay } from '@/utils/delay';

const API_BASE = '/api';

export const commentApi = {
  async getComments(activityId: string): Promise<Comment[]> {
    await simulateDelay();
    const response = await fetch(`${API_BASE}/activities/${activityId}/comments`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '获取评论失败' }));
      throw new Error(error.error || '获取评论失败');
    }
    return response.json();
  },

  async createComment(activityId: string, data: CreateCommentRequest): Promise<Comment> {
    await simulateDelay();
    const response = await fetch(`${API_BASE}/activities/${activityId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '发布评论失败' }));
      throw new Error(error.error || '发布评论失败');
    }
    return response.json();
  },

  async toggleLike(commentId: string, userName: string): Promise<LikeResponse> {
    await simulateDelay();
    const response = await fetch(`${API_BASE}/comments/${commentId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName } as LikeRequest),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '操作失败' }));
      throw new Error(error.error || '操作失败');
    }
    return response.json();
  },
};
