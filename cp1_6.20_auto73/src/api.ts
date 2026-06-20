import type { Card, Connection, ProjectData } from './types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  getCards: (): Promise<Card[]> => request<Card[]>('/cards'),
  
  createCard: (card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>): Promise<Card> =>
    request<Card>('/cards', {
      method: 'POST',
      body: JSON.stringify(card),
    }),
  
  updateCard: (id: string, card: Partial<Card>): Promise<Card> =>
    request<Card>(`/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(card),
    }),
  
  deleteCard: (id: string): Promise<void> =>
    request<void>(`/cards/${id}`, {
      method: 'DELETE',
    }),
  
  getConnections: (): Promise<Connection[]> => request<Connection[]>('/connections'),
  
  createConnection: (connection: Omit<Connection, 'id' | 'createdAt'>): Promise<Connection> =>
    request<Connection>('/connections', {
      method: 'POST',
      body: JSON.stringify(connection),
    }),
  
  updateConnection: (id: string, connection: Partial<Connection>): Promise<Connection> =>
    request<Connection>(`/connections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(connection),
    }),
  
  deleteConnection: (id: string): Promise<void> =>
    request<void>(`/connections/${id}`, {
      method: 'DELETE',
    }),
  
  getProject: (): Promise<ProjectData> => request<ProjectData>('/project'),
  
  updateProject: (data: ProjectData): Promise<ProjectData> =>
    request<ProjectData>('/project', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  exportProject: (): Promise<ProjectData> => request<ProjectData>('/export'),
};
