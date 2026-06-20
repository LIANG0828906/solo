import { NodeData, RelationData } from '../types';

const API_BASE = '/api';

export const fetchNodes = async (): Promise<NodeData[]> => {
  const res = await fetch(`${API_BASE}/nodes`);
  return res.json();
};

export const fetchRelations = async (): Promise<RelationData[]> => {
  const res = await fetch(`${API_BASE}/relations`);
  return res.json();
};

export const createNode = async (data: Partial<NodeData>): Promise<NodeData> => {
  const res = await fetch(`${API_BASE}/nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const updateNode = async (id: string, data: Partial<NodeData>): Promise<NodeData> => {
  const res = await fetch(`${API_BASE}/nodes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deleteNode = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/nodes/${id}`, { method: 'DELETE' });
};

export const createRelation = async (data: { source: string; target: string; type: string }): Promise<RelationData> => {
  const res = await fetch(`${API_BASE}/relations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deleteRelation = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/relations/${id}`, { method: 'DELETE' });
};
