import type { User, Artifact, WorkStep } from '../types';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export const authAPI = {
  register: (username: string, password: string) =>
    request<{ success: boolean; user: Omit<User, 'password'>; token: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ username, password }) }
    ),
  
  login: (username: string, password: string) =>
    request<{ success: boolean; user: Omit<User, 'password'>; token: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ username, password }) }
    ),
};

export const artifactsAPI = {
  getAll: (userId: string) =>
    request<{ artifacts: Artifact[] }>(`/artifacts?userId=${userId}`),
  
  getOne: (id: string) =>
    request<{ artifact: Artifact }>(`/artifacts/${id}`),
  
  create: (data: {
    userId: string;
    name: string;
    description: string;
    bambooType: string;
    lacquerColor: string;
    pattern: number[][];
    artifactType: string;
    steps: WorkStep[];
    thumbnail: string;
  }) =>
    request<{ artifact: Artifact }>('/artifacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Artifact>) =>
    request<{ artifact: Artifact }>(`/artifacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    request<{ success: boolean }>(`/artifacts/${id}`, {
      method: 'DELETE',
    }),
};
