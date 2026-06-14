import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

const client: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('pixelvault_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pixelvault_token');
      localStorage.removeItem('pixelvault_user');
      if (!window.location.pathname.endsWith('/login') && !window.location.pathname.endsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await client.get(url, config);
  return res.data as T;
}

export async function apiPost<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await client.post(url, data, config);
  return res.data as T;
}

export default client;
