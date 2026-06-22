import { Note, User } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

export const authAPI = {
  login: async (username: string, password: string): Promise<{ user: User }> => {
    return request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  register: async (username: string, password: string): Promise<{ user: User }> => {
    return request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
};

export const notesAPI = {
  getAll: async (userId: number = 1): Promise<{ notes: Note[] }> => {
    return request<{ notes: Note[] }>(`/notes?user_id=${userId}`);
  },

  create: async (data: {
    word: string;
    ipa: string;
    description?: string;
    language_family?: string;
    audio?: File;
    user_id?: number;
  }): Promise<{ note: Note }> => {
    const formData = new FormData();
    formData.append('word', data.word);
    formData.append('ipa', data.ipa);
    if (data.description) formData.append('description', data.description);
    if (data.language_family) formData.append('language_family', data.language_family);
    if (data.audio) formData.append('audio', data.audio);
    formData.append('user_id', String(data.user_id || 1));

    const response = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '创建失败' }));
      throw new Error(error.error || '创建失败');
    }

    return response.json();
  },

  update: async (
    id: number,
    data: Partial<{
      word: string;
      ipa: string;
      description: string;
      language_family: string;
    }>
  ): Promise<{ note: Note }> => {
    return request<{ note: Note }>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  remove: async (id: number): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/notes/${id}`, {
      method: 'DELETE',
    });
  },
};

export const statsAPI = {
  getFamilyStats: async (userId: number = 1): Promise<{
    stats: { language_family: string; count: number }[];
  }> => {
    return request<{ stats: { language_family: string; count: number }[] }>(
      `/stats/families?user_id=${userId}`
    );
  },
};
