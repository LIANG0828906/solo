import axios from 'axios';
import type { Card, Difficulty, ReviewStats } from '../types';

const API_BASE = '/api';

export const api = {
  getCards: async (): Promise<Card[]> => {
    const response = await axios.get(`${API_BASE}/cards`);
    return response.data;
  },

  getCard: async (id: string): Promise<Card> => {
    const response = await axios.get(`${API_BASE}/cards/${id}`);
    return response.data;
  },

  createCard: async (card: Omit<Card, 'id' | 'currentInterval' | 'nextReviewDate' | 'reviewHistory' | 'createdAt'>): Promise<Card> => {
    const response = await axios.post(`${API_BASE}/cards`, card);
    return response.data;
  },

  updateCard: async (id: string, card: Partial<Card>): Promise<Card> => {
    const response = await axios.put(`${API_BASE}/cards/${id}`, card);
    return response.data;
  },

  deleteCard: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/cards/${id}`);
  },

  reviewCard: async (id: string, difficulty: Difficulty): Promise<Card> => {
    const response = await axios.post(`${API_BASE}/cards/${id}/review`, { difficulty });
    return response.data;
  },

  getDueCards: async (): Promise<Card[]> => {
    const response = await axios.get(`${API_BASE}/cards/due`);
    return response.data;
  },

  getStats: async (): Promise<ReviewStats> => {
    const response = await axios.get(`${API_BASE}/stats`);
    return response.data;
  },

  exportData: async (): Promise<Card[]> => {
    const response = await axios.get(`${API_BASE}/export`);
    return response.data;
  }
};
