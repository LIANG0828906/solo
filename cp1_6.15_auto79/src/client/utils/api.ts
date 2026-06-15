import axios from 'axios';
import type { Project, ProjectDetail, Version, Note } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await api.get<ApiResponse<Project[]>>('/projects');
  if (!res.data.success) throw new Error(res.data.error);
  return res.data.data || [];
}

export async function createProject(payload: {
  name: string;
  key: string;
  bpm: number;
  instruments: string[];
  creatorId: string;
  creatorName: string;
}): Promise<Project> {
  const res = await api.post<ApiResponse<Project>>('/projects', payload);
  if (!res.data.success) throw new Error(res.data.error);
  return res.data.data!;
}

export async function fetchProject(id: string): Promise<ProjectDetail> {
  const res = await api.get<ApiResponse<ProjectDetail>>(`/projects/${id}`);
  if (!res.data.success) throw new Error(res.data.error);
  return res.data.data!;
}

export async function joinProject(id: string, joinCode: string): Promise<ProjectDetail> {
  const res = await api.post<ApiResponse<ProjectDetail>>(`/projects/${id}/join`, { joinCode });
  if (!res.data.success) throw new Error(res.data.error);
  return res.data.data!;
}

export async function fetchVersions(projectId: string): Promise<Version[]> {
  const res = await api.get<ApiResponse<Version[]>>(`/projects/${projectId}/versions`);
  if (!res.data.success) throw new Error(res.data.error);
  return res.data.data || [];
}

export async function createVersion(payload: {
  projectId: string;
  snapshot: Note[];
  creatorId: string;
  creatorName: string;
  name?: string;
}): Promise<Version> {
  const res = await api.post<ApiResponse<Version>>(
    `/projects/${payload.projectId}/versions`,
    {
      name: payload.name,
      snapshot: payload.snapshot,
      creatorId: payload.creatorId,
      creatorName: payload.creatorName,
    },
  );
  if (!res.data.success) throw new Error(res.data.error);
  return res.data.data!;
}

export async function exportProject(
  projectId: string,
  format: 'pdf' | 'midi' | 'json',
): Promise<Blob> {
  const res = await api.get(`/projects/${projectId}/export?format=${format}`, {
    responseType: 'blob',
  });
  return res.data;
}

export function getAvatarColor(name: string): string {
  const colors = [
    '#e94560', '#0f3460', '#533483', '#00b4d8',
    '#90be6d', '#f9c74f', '#f8961e', '#9d4edd',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return '刚刚';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分钟前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}小时前`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}天前`;
  return date.toLocaleDateString('zh-CN');
}

export function generateUserId(): string {
  return 'user_' + Math.random().toString(36).slice(2, 10);
}

export function getStoredUser(): { id: string; name: string } | null {
  try {
    const raw = localStorage.getItem('band_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: { id: string; name: string }) {
  localStorage.setItem('band_user', JSON.stringify(user));
}
