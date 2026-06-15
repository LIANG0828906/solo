
import { Walnut, User, AuthResponse } from '../types';

const BASE_URL = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {},
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || '请求失败');
  }

  return data as T;
}

export const api = {
  auth: {
    register(username: string, password: string): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
    },

    login(username: string, password: string): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
    },
  },

  walnuts: {
    getAll(): Promise<Walnut[]> {
      return request<Walnut[]>('/walnuts');
    },

    getById(id: string): Promise<Walnut> {
      return request<Walnut>(`/walnuts/${id}`);
    },

    getMarket(): Promise<Walnut[]> {
      return request<Walnut[]>('/walnuts/market');
    },

    buy(id: string): Promise<{ message: string; walnut: Walnut; user: User }> {
      return request<{ message: string; walnut: Walnut; user: User }>(`/walnuts/${id}/buy`, {
        method: 'POST',
      });
    },
  },

  user: {
    getProfile(): Promise<User> {
      return request<User>('/user/profile');
    },

    getFavorites(): Promise<Walnut[]> {
      return request<Walnut[]>('/user/favorites');
    },

    addFavorite(id: string): Promise<{ message: string; user: User }> {
      return request<{ message: string; user: User }>(`/user/favorites/${id}`, {
        method: 'POST',
      });
    },

    removeFavorite(id: string): Promise<{ message: string; user: User }> {
      return request<{ message: string; user: User }>(`/user/favorites/${id}`, {
        method: 'DELETE',
      });
    },

    syncFavorites(favorites: string[]): Promise<{ message: string; favorites: Walnut[] }> {
      return request<{ message: string; favorites: Walnut[] }>('/user/favorites/sync', {
        method: 'POST',
        body: JSON.stringify({ favorites }),
      });
    },
  },
};
