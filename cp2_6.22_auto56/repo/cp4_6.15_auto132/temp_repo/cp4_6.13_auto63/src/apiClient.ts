const baseURL = '/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const request = async (url: string, options: RequestOptions = {}): Promise<any> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${baseURL}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      clearAuthAndRedirect();
      throw new Error('Unauthorized');
    }

    const contentType = response.headers.get('content-type');
    let data: any = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const message = typeof data === 'object' && data.message ? data.message : `HTTP ${response.status}`;
      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      throw error;
    }
    throw error;
  }
};

const apiClient = {
  get: (url: string, options: RequestOptions = {}): Promise<any> => {
    return request(url, { ...options, method: 'GET' });
  },

  post: (url: string, body?: any, options: RequestOptions = {}): Promise<any> => {
    return request(url, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch: (url: string, body?: any, options: RequestOptions = {}): Promise<any> => {
    return request(url, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete: (url: string, options: RequestOptions = {}): Promise<any> => {
    return request(url, { ...options, method: 'DELETE' });
  },
};

export default apiClient;
