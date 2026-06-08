interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const DEFAULT_TIMEOUT = 10000;

const buildQueryString = (params: Record<string, string | number | boolean | undefined>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
};

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

const removeToken = (): void => {
  localStorage.removeItem('token');
};

class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const request = async <T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> => {
  const { params, timeout = DEFAULT_TIMEOUT, headers, body, ...restOptions } = options;

  let url = `${BASE_URL}${endpoint}`;
  if (params && Object.keys(params).length > 0) {
    const queryString = buildQueryString(params);
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let data: unknown;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (data as { message?: string })?.message ||
        `HTTP error! status: ${response.status}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    if (typeof data === 'object' && data !== null && 'data' in data) {
      return data as ApiResponse<T>;
    }

    return {
      data: data as T,
      success: true,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('请求超时，请稍后重试', 408);
    }
    throw new ApiError(
      error instanceof Error ? error.message : '网络连接失败',
      0
    );
  }
};

const api = {
  get: <T>(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  upload: <T>(endpoint: string, formData: FormData, options?: Omit<ApiOptions, 'method' | 'body' | 'headers'>) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {},
    }),
};

export { api, ApiError, getToken, setToken, removeToken };
export type { ApiOptions, ApiResponse };
export default api;
