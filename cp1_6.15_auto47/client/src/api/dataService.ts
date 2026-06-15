import type { Plot, Notice, GrowthLog, Comment } from '../types';

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

export async function getPlots(): Promise<Plot[]> {
  return request<Plot[]>('/plots');
}

export async function addPlotLog(plotId: string, log: Omit<GrowthLog, 'id'>): Promise<GrowthLog> {
  return request<GrowthLog>(`/plots/${plotId}/logs`, {
    method: 'POST',
    body: JSON.stringify(log),
  });
}

export async function updatePlotLog(
  plotId: string,
  logId: string,
  log: Partial<GrowthLog>
): Promise<GrowthLog> {
  return request<GrowthLog>(`/plots/${plotId}/logs/${logId}`, {
    method: 'PUT',
    body: JSON.stringify(log),
  });
}

export async function deletePlotLog(plotId: string, logId: string): Promise<void> {
  return request<void>(`/plots/${plotId}/logs/${logId}`, {
    method: 'DELETE',
  });
}

export async function getNotices(): Promise<Notice[]> {
  return request<Notice[]>('/notices');
}

export async function likeNotice(noticeId: string, userId: string): Promise<Notice> {
  return request<Notice>(`/notices/${noticeId}/like`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function addComment(
  noticeId: string,
  comment: Omit<Comment, 'id' | 'createdAt'>
): Promise<Comment> {
  return request<Comment>(`/notices/${noticeId}/comments`, {
    method: 'POST',
    body: JSON.stringify(comment),
  });
}
