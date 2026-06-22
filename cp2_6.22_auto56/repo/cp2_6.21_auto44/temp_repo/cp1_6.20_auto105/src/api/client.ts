import type { Storyboard, ApiResponse } from '../types';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = (await res.json()) as ApiResponse<T>;
  if (!data.success || !res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data.data!;
}

export const api = {
  listStoryboards: () =>
    request<Omit<Storyboard, 'cards' | 'musicUrl'> & { cover: string }[]>('/api/storyboards'),

  getStoryboard: (id: string) => request<Storyboard>(`/api/storyboards/${id}`),

  createStoryboard: (payload: { title: string; cover?: string }) =>
    request<Storyboard>('/api/storyboards', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateStoryboard: (id: string, payload: Partial<Storyboard>) =>
    request<Storyboard>(`/api/storyboards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteStoryboard: (id: string) =>
    request<{}>(`/api/storyboards/${id}`, { method: 'DELETE' }),

  uploadImage: async (id: string, file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/storyboards/${id}/upload`, {
      method: 'POST',
      body: fd,
    });
    const data = (await res.json()) as ApiResponse<{ imageUrl: string }>;
    if (!data.success || !data.data) throw new Error(data.error || '上传失败');
    return data.data.imageUrl;
  },
};
