import axios from 'axios';
import type { Card, MemoryLevel, GraphNode, GraphLink } from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export async function fetchCards(search?: string, category?: string): Promise<Card[]> {
  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (category && category !== 'all') params.category = category;
  const res = await api.get('/cards', { params });
  return res.data.data;
}

export async function fetchCard(id: string): Promise<Card> {
  const res = await api.get(`/cards/${id}`);
  return res.data.data;
}

export async function createCard(data: Partial<Card>): Promise<Card> {
  const res = await api.post('/cards', data);
  return res.data.data;
}

export async function updateCard(id: string, data: Partial<Card>): Promise<Card> {
  const res = await api.put(`/cards/${id}`, data);
  return res.data.data;
}

export async function deleteCard(id: string): Promise<void> {
  await api.delete(`/cards/${id}`);
}

export async function fetchDueCards(): Promise<Card[]> {
  const res = await api.get('/cards/due/today');
  return res.data.data;
}

export async function reviewCard(id: string, memoryLevel: MemoryLevel): Promise<Card> {
  const res = await api.put(`/cards/${id}/review`, { memoryLevel });
  return res.data.data;
}

export async function addLink(cardId: string, targetCardId: string): Promise<void> {
  await api.post(`/cards/${cardId}/links`, { targetCardId });
}

export async function removeLink(cardId: string, targetId: string): Promise<void> {
  await api.delete(`/cards/${cardId}/links/${targetId}`);
}

export async function fetchGraphData(): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
  const res = await api.get('/cards/links/graph');
  return res.data.data;
}
