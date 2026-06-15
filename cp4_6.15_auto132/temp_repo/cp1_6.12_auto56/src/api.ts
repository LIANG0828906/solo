const API_BASE = '/api';

export interface Card {
  id: string;
  title: string;
  tags: string[];
  body: string;
  createdAt: string;
}

export interface Edge {
  source: string;
  target: string;
  weight: number;
}

export interface GraphData {
  nodes: Card[];
  edges: Edge[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function fetchCards(): Promise<Card[]> {
  return request<Card[]>('/cards');
}

export async function fetchCard(id: string): Promise<Card> {
  return request<Card>(`/cards/${id}`);
}

export async function createCard(data: Omit<Card, 'id' | 'createdAt'>): Promise<Card> {
  return request<Card>('/cards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCard(id: string, data: Partial<Omit<Card, 'id' | 'createdAt'>>): Promise<Card> {
  return request<Card>(`/cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCard(id: string): Promise<void> {
  return request<void>(`/cards/${id}`, { method: 'DELETE' });
}

export async function fetchRecommendations(id: string): Promise<Card[]> {
  return request<Card[]>(`/cards/${id}/recommendations`);
}

export async function createEdge(source: string, target: string, weight: number): Promise<Edge> {
  return request<Edge>('/edges', {
    method: 'POST',
    body: JSON.stringify({ source, target, weight }),
  });
}

export async function fetchGraphData(): Promise<GraphData> {
  return request<GraphData>('/graph');
}

export async function fetchTags(): Promise<string[]> {
  return request<string[]>('/tags');
}
