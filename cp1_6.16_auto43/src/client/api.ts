import { SeedItem, ExchangeRequest, Stats } from '../types';

const API_BASE = '/api';

export const api = {
  login: async (nickname: string): Promise<{ success: boolean; nickname: string }> => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });
    return res.json();
  },

  getItems: async (filters?: {
    search?: string;
    variety?: string;
    location?: string;
    minQuantity?: number;
    maxQuantity?: number;
  }): Promise<SeedItem[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const url = `${API_BASE}/items${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    return res.json();
  },

  getVarieties: async (): Promise<string[]> => {
    const res = await fetch(`${API_BASE}/items/varieties`);
    return res.json();
  },

  getLocations: async (): Promise<string[]> => {
    const res = await fetch(`${API_BASE}/items/locations`);
    return res.json();
  },

  createItem: async (item: Omit<SeedItem, 'id' | 'createdAt'>): Promise<SeedItem> => {
    const res = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return res.json();
  },

  getUserItems: async (nickname: string): Promise<SeedItem[]> => {
    const res = await fetch(`${API_BASE}/items/user/${nickname}`);
    return res.json();
  },

  createRequest: async (data: {
    fromUser: string;
    seedItemId: string;
    exchangeQuantity: number;
  }): Promise<ExchangeRequest> => {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getRequestsFrom: async (nickname: string): Promise<ExchangeRequest[]> => {
    const res = await fetch(`${API_BASE}/requests/from/${nickname}`);
    return res.json();
  },

  getRequestsTo: async (nickname: string): Promise<ExchangeRequest[]> => {
    const res = await fetch(`${API_BASE}/requests/to/${nickname}`);
    return res.json();
  },

  confirmRequest: async (id: string): Promise<ExchangeRequest> => {
    const res = await fetch(`${API_BASE}/requests/${id}/confirm`, {
      method: 'PUT',
    });
    return res.json();
  },

  cancelRequest: async (id: string): Promise<ExchangeRequest> => {
    const res = await fetch(`${API_BASE}/requests/${id}/cancel`, {
      method: 'PUT',
    });
    return res.json();
  },

  rejectRequest: async (id: string): Promise<ExchangeRequest> => {
    const res = await fetch(`${API_BASE}/requests/${id}/reject`, {
      method: 'PUT',
    });
    return res.json();
  },

  getStats: async (): Promise<Stats> => {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  },

  getCompletedHistory: async (nickname: string): Promise<ExchangeRequest[]> => {
    const res = await fetch(`${API_BASE}/history/completed/${nickname}`);
    return res.json();
  },
};
