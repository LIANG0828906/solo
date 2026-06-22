import axios from 'axios';
import type { Lyric, Comment, Mood, ApiResponse } from '../../shared/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const lyricApi = {
  generate: async (keyword: string, mood: Mood): Promise<Lyric> => {
    const res = await api.post<ApiResponse<Lyric>>('/lyric/generate', { keyword, mood });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || '生成失败');
    }
    return res.data.data;
  },

  favorite: async (id: string): Promise<number> => {
    const res = await api.post<ApiResponse<{ favorites: number }>>(`/lyric/${id}/favorite`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || '操作失败');
    }
    return res.data.data.favorites;
  },

  like: async (id: string): Promise<number> => {
    const res = await api.post<ApiResponse<{ likes: number }>>(`/lyric/${id}/like`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || '操作失败');
    }
    return res.data.data.likes;
  },

  comment: async (id: string, content: string): Promise<Comment> => {
    const res = await api.post<ApiResponse<Comment>>(`/lyric/${id}/comment`, { content });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || '评论失败');
    }
    return res.data.data;
  },

  getById: async (id: string): Promise<Lyric> => {
    const res = await api.get<ApiResponse<Lyric>>(`/lyric/${id}`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || '获取失败');
    }
    return res.data.data;
  },
};

export const galleryApi = {
  getList: async (params?: {
    mood?: Mood;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Lyric[]; total: number }> => {
    const res = await api.get<ApiResponse<Lyric[]>>('/gallery', { params });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || '获取失败');
    }
    return { data: res.data.data, total: res.data.total || 0 };
  },
};
