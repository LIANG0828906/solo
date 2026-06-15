import type { KnowledgeGraph, Note, HistorySnapshot } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function parseNote(content: string): Promise<{ graph: KnowledgeGraph; note: Note }> {
  return request('/notes', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function getGraph(): Promise<KnowledgeGraph> {
  return request('/graph');
}

export async function updateGraph(graph: KnowledgeGraph): Promise<{ success: boolean; snapshotId: string }> {
  return request('/graph/update', {
    method: 'POST',
    body: JSON.stringify({ graph }),
  });
}

export async function getHistory(): Promise<HistorySnapshot[]> {
  return request('/history');
}

export async function rollbackHistory(snapshotId: string): Promise<{ success: boolean; graph: KnowledgeGraph }> {
  return request('/history/rollback', {
    method: 'POST',
    body: JSON.stringify({ snapshotId }),
  });
}

export const api = {
  parseNote,
  getGraph,
  updateGraph,
  getHistory,
  rollbackHistory,
};

export default api;
