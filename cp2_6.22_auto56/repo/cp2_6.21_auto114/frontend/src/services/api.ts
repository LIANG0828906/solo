import axios from 'axios';
import type { NodeData, RelationData, ShareInfo, FamilyTreeStats } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export interface CreateTreePayload {
  name: string;
  nodes: NodeData[];
  relations: RelationData[];
}

export interface CreateTreeResponse {
  id: string;
  name: string;
  createdAt: string;
}

export interface GetTreeResponse {
  id: string;
  name: string;
  nodes: NodeData[];
  relations: RelationData[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTreePayload {
  name?: string;
  nodes: NodeData[];
  relations: RelationData[];
}

export interface ExportData {
  version: string;
  exportedAt: string;
  name: string;
  nodes: NodeData[];
  relations: RelationData[];
  stats: FamilyTreeStats;
}

export async function createTree(payload: CreateTreePayload): Promise<CreateTreeResponse> {
  try {
    const { data } = await api.post<CreateTreeResponse>('/family-trees', payload);
    return data;
  } catch (e) {
    console.warn('createTree fallback (offline mode)', e);
    const id = 'local-' + Date.now().toString(36);
    return { id, name: payload.name, createdAt: new Date().toISOString() };
  }
}

export async function getTree(id: string): Promise<GetTreeResponse | null> {
  try {
    const { data } = await api.get<GetTreeResponse>(`/family-trees/${id}`);
    return data;
  } catch (e) {
    console.warn('getTree failed', e);
    return null;
  }
}

export async function updateTree(
  id: string,
  payload: UpdateTreePayload,
): Promise<{ success: boolean }> {
  try {
    const { data } = await api.put(`/family-trees/${id}`, payload);
    return data;
  } catch (e) {
    console.warn('updateTree failed', e);
    return { success: false };
  }
}

export async function deleteTree(id: string): Promise<{ success: boolean }> {
  try {
    const { data } = await api.delete(`/family-trees/${id}`);
    return data;
  } catch (e) {
    console.warn('deleteTree failed', e);
    return { success: false };
  }
}

export async function generateShare(id: string): Promise<ShareInfo | null> {
  try {
    const { data } = await api.get<ShareInfo>(`/family-trees/${id}/share`);
    return data;
  } catch (e) {
    console.warn('generateShare failed, using local fallback', e);
    const token = btoa(encodeURIComponent(id + ':' + Date.now()));
    return {
      shareUrl: `${window.location.origin}/#share=${token}`,
      stats: { totalMembers: 0, generations: 0 },
    };
  }
}

export async function getSharedTree(token: string): Promise<GetTreeResponse | null> {
  try {
    const { data } = await api.get<GetTreeResponse>(`/share/${token}`);
    return data;
  } catch (e) {
    console.warn('getSharedTree failed', e);
    return null;
  }
}

export function downloadExport(data: ExportData, filename: string = 'family-tree.json'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importFromFile(file: File): Promise<{ nodes: NodeData[]; relations: RelationData[]; name?: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        resolve({
          nodes: json.nodes || [],
          relations: json.relations || [],
          name: json.name,
        });
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export default api;
