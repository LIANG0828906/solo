import axios from 'axios';
import { Card, Deck, BattleRecord, UserStats } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const cardApi = {
  getAll: () => api.get<Card[]>('/cards').then((r) => r.data),
  getById: (id: string) => api.get<Card>(`/cards/${id}`).then((r) => r.data),
};

export const deckApi = {
  getAll: () => api.get<Deck[]>('/decks').then((r) => r.data),
  create: (data: { name: string; cards: { cardId: string; count: number }[] }) =>
    api.post<Deck>('/decks', data).then((r) => r.data),
  update: (id: string, data: Partial<{ name: string; cards: { cardId: string; count: number }[] }>) =>
    api.put<Deck>(`/decks/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/decks/${id}`).then((r) => r.data),
};

export const battleApi = {
  getAll: () => api.get<BattleRecord[]>('/battles').then((r) => r.data),
  create: (data: any) => api.post<BattleRecord>('/battles', data).then((r) => r.data),
  getById: (id: string) => api.get<BattleRecord>(`/battles/${id}`).then((r) => r.data),
  delete: (id: string) => api.delete(`/battles/${id}`).then((r) => r.data),
};

export const statsApi = {
  get: () => api.get<UserStats>('/stats').then((r) => r.data),
};

export default api;
