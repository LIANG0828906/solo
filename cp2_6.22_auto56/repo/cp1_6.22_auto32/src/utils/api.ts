const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

interface RequestOptions extends RequestInit {
  body?: any;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.body && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data as T;
}

export const api = {
  users: {
    register: (data: { username: string; password: string; nickname: string }) =>
      request('/users/register', { method: 'POST', body: data }),
    login: (data: { username: string; password: string }) =>
      request('/users/login', { method: 'POST', body: data }),
    getProfile: () => request('/users/profile'),
    updateProfile: (data: { nickname: string; bio: string }) =>
      request('/users/profile', { method: 'PUT', body: data }),
    logout: () => request('/users/logout', { method: 'POST' }),
    getUserPoems: (userId: string) => request(`/users/${userId}/poems`),
    getLikedPoems: () => request('/users/liked/poems'),
  },
  poems: {
    getList: (params?: { sort?: string; tag?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request(`/poems${query ? `?${query}` : ''}`);
    },
    getDetail: (id: string) => request(`/poems/${id}`),
    create: (data: { title: string; content: string; tags: string[] }) =>
      request('/poems', { method: 'POST', body: data }),
    like: (id: string) => request(`/poems/${id}/like`, { method: 'POST' }),
    addComment: (id: string, content: string) =>
      request(`/poems/${id}/comments`, { method: 'POST', body: { content } }),
  },
};
