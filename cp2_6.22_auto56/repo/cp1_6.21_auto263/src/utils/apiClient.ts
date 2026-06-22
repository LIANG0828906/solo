import axios from 'axios';

export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  collapsed: boolean;
}

export interface MindMapData {
  id?: string;
  name: string;
  nodes: MindMapNode[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MindMapListItem {
  id: string;
  name: string;
  updatedAt: string;
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

export const saveMindMap = async (data: MindMapData): Promise<MindMapData> => {
  const response = await api.post<MindMapData>('/mindmaps', data);
  return response.data;
};

export const loadMindMap = async (id: string): Promise<MindMapData> => {
  const response = await api.get<MindMapData>(`/mindmaps/${id}`);
  return response.data;
};

export const listMindMaps = async (): Promise<MindMapListItem[]> => {
  const response = await api.get<MindMapListItem[]>('/mindmaps');
  return response.data;
};

export const deleteMindMap = async (id: string): Promise<void> => {
  await api.delete(`/mindmaps/${id}`);
};
