import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Canvas {
  id: string;
  name: string;
  lastModified: string;
  members: User[];
  nodeCount: number;
}

export interface MindNode {
  id: string;
  text: string;
  parentId: string | null;
  x: number;
  y: number;
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
  icon?: string;
  children?: MindNode[];
  richText?: {
    bold?: boolean;
    italic?: boolean;
    list?: boolean;
  };
}

export interface VersionSnapshot {
  id: string;
  canvasId: string;
  timestamp: string;
  savedBy: User;
  nodeTree: MindNode[];
}

export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
}

export async function getCanvases(): Promise<Canvas[]> {
  const { data } = await api.get('/canvases');
  return data;
}

export async function createCanvas(name: string): Promise<Canvas> {
  const { data } = await api.post('/canvases', { name });
  return data;
}

export async function deleteCanvas(id: string): Promise<void> {
  await api.delete(`/canvases/${id}`);
}

export async function getCanvasNodes(canvasId: string): Promise<MindNode[]> {
  const { data } = await api.get(`/canvases/${canvasId}/nodes`);
  return data;
}

export async function getHistory(canvasId: string): Promise<VersionSnapshot[]> {
  const { data } = await api.get(`/canvases/${canvasId}/history`);
  return data;
}

export async function saveSnapshot(canvasId: string, nodeTree: MindNode[]): Promise<VersionSnapshot> {
  const { data } = await api.post(`/canvases/${canvasId}/history`, { nodeTree });
  return data;
}

export async function restoreVersion(canvasId: string, versionId: string): Promise<MindNode[]> {
  const { data } = await api.post(`/canvases/${canvasId}/history/${versionId}/restore`);
  return data;
}

export async function inviteMember(canvasId: string, email: string): Promise<void> {
  await api.post(`/canvases/${canvasId}/members`, { email });
}

export async function searchNodes(canvasId: string, query: string): Promise<MindNode[]> {
  const { data } = await api.get(`/canvases/${canvasId}/nodes/search`, { params: { query } });
  return data;
}
