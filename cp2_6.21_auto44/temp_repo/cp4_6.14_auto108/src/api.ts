import type { Card, CardCreate, Stats } from './types';

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getCards: (): Promise<Card[]> => request<Card[]>('/cards'),
  getCard: (id: string): Promise<Card> => request<Card>(`/cards/${id}`),
  createCard: (data: CardCreate): Promise<Card> =>
    request<Card>('/cards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCardReview: (id: string, remembered: boolean): Promise<Card> =>
    request<Card>(`/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ remembered }),
    }),
  deleteCard: (id: string): Promise<{ success: boolean }> =>
    request<{ success: boolean }>(`/cards/${id}`, {
      method: 'DELETE',
    }),
  getDueCards: (): Promise<Card[]> => request<Card[]>('/cards/review/due'),
  getStats: (): Promise<Stats> => request<Stats>('/stats'),
};
