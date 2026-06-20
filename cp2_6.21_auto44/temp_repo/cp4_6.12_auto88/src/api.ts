import axios from 'axios';
import { Meme } from './types';

const api = axios.create({
  baseURL: '/api',
});

export async function fetchMemes(page: number = 1, limit: number = 20, tag?: string): Promise<{ memes: Meme[]; total: number }> {
  const params: Record<string, string | number> = { page, limit };
  if (tag) params.tag = tag;
  const res = await api.get('/memes', { params });
  return res.data;
}

export async function createMeme(formData: FormData): Promise<Meme> {
  const res = await api.post('/memes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function toggleLike(id: string): Promise<Meme> {
  const res = await api.post(`/memes/${id}/like`);
  return res.data;
}

export async function updateMeme(id: string, data: Partial<Meme>): Promise<Meme> {
  const res = await api.put(`/memes/${id}`, data);
  return res.data;
}

export async function deleteMeme(id: string): Promise<void> {
  await api.delete(`/memes/${id}`);
}
