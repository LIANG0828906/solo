import axios from 'axios';
import type { Card } from './types';

const api = axios.create({
  baseURL: '/api',
});

export const getCards = (): Promise<Card[]> => {
  return api.get('/cards').then(res => res.data);
};

export const getCard = (id: number): Promise<Card> => {
  return api.get(`/cards/${id}`).then(res => res.data);
};

export const createCard = (
  card: Omit<Card, 'id' | 'created_at' | 'updated_at'>
): Promise<Card> => {
  return api.post('/cards', card).then(res => res.data);
};

export const updateCard = (
  id: number,
  data: Partial<Card>
): Promise<Card> => {
  return api.put(`/cards/${id}`, data).then(res => res.data);
};

export const deleteCard = (id: number): Promise<void> => {
  return api.delete(`/cards/${id}`);
};

export const saveVersion = (
  cardId: number,
  operationType: string
): Promise<void> => {
  return api.post(`/cards/${cardId}/versions`, { operationType });
};

export const restoreVersion = (
  cardId: number,
  versionId: number
): Promise<Card> => {
  return api.post(`/cards/${cardId}/versions/${versionId}/restore`).then(res => res.data);
};
