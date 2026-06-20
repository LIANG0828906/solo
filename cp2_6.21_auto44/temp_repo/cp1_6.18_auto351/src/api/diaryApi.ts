import type { DiaryEntry, Comment, User } from '../types';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = '/api';

const delay = <T>(data: T, ms = 300): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

export const diaryApi = {
  async getPublicDiaries() {
    const response = await fetch(`${API_BASE_URL}/diaries/public`);
    if (!response.ok) throw new Error('获取日记列表失败');
    return (await response.json()) as DiaryEntry[];
  },

  async getDiaryById(id: string) {
    const response = await fetch(`${API_BASE_URL}/diaries/${id}`);
    if (!response.ok) throw new Error('获取日记详情失败');
    return (await response.json()) as DiaryEntry;
  },

  async createDiary(diary: Omit<DiaryEntry, 'id' | 'createdAt' | 'commentCount'>) {
    const response = await fetch(`${API_BASE_URL}/diaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(diary),
    });
    if (!response.ok) throw new Error('创建日记失败');
    return (await response.json()) as DiaryEntry;
  },

  async updateDiary(id: string, updates: Partial<DiaryEntry>) {
    const response = await fetch(`${API_BASE_URL}/diaries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('更新日记失败');
    return (await response.json()) as DiaryEntry;
  },

  async deleteDiary(id: string) {
    const response = await fetch(`${API_BASE_URL}/diaries/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('删除日记失败');
    return true;
  },

  async getComments(diaryId: string) {
    const response = await fetch(`${API_BASE_URL}/diaries/${diaryId}/comments`);
    if (!response.ok) throw new Error('获取评论失败');
    return (await response.json()) as Comment[];
  },

  async createComment(comment: Omit<Comment, 'id' | 'createdAt'>) {
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    });
    if (!response.ok) throw new Error('创建评论失败');
    return (await response.json()) as Comment;
  },

  async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error('登录失败');
    return (await response.json()) as { user: User; token: string };
  },

  async register(userData: { name: string; email: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('注册失败');
    return (await response.json()) as { user: User; token: string };
  },

  async uploadAudio(blob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', blob, `${uuidv4()}.webm`);
    const response = await fetch(`${API_BASE_URL}/upload/audio`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('上传音频失败');
    const data = (await response.json()) as { url: string };
    return data.url;
  },
};

export const mockDiaryApi = {
  async getPublicDiaries(): Promise<DiaryEntry[]> {
    return delay([] as DiaryEntry[]);
  },

  async getDiaryById(_id: string): Promise<DiaryEntry | null> {
    return delay(null);
  },

  async createDiary(
    diary: Omit<DiaryEntry, 'id' | 'createdAt' | 'commentCount'>
  ): Promise<DiaryEntry> {
    return delay({
      ...diary,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      commentCount: 0,
    });
  },

  async getComments(_diaryId: string): Promise<Comment[]> {
    return delay([]);
  },

  async createComment(
    comment: Omit<Comment, 'id' | 'createdAt'>
  ): Promise<Comment> {
    return delay({
      ...comment,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    });
  },

  async uploadAudio(_blob: Blob): Promise<string> {
    return delay('mock-audio-url');
  },
};
