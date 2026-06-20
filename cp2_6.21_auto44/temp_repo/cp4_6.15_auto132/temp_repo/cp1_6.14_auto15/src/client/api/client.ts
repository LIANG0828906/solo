import axios, { type AxiosInstance } from 'axios';
import type {
  SessionUser,
  Instrument,
  Order,
  GetInstrumentsParams,
  LoginData,
  RegisterData,
  CreateOrderData,
  OrderStatus,
} from '../types';

const apiClient: AxiosInstance = axios.create({
  baseURL: '',
  withCredentials: true,
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || '请求失败';
    return Promise.reject(new Error(message));
  },
);

export async function getMe(): Promise<{ user: SessionUser | null }> {
  return apiClient.get('/api/auth/me');
}

export async function login(data: LoginData): Promise<{ success: boolean; user: SessionUser }> {
  return apiClient.post('/api/auth/login', data);
}

export async function register(
  data: RegisterData,
): Promise<{ success: boolean; user: SessionUser }> {
  return apiClient.post('/api/auth/register', data);
}

export async function logout(): Promise<{ success: boolean }> {
  return apiClient.post('/api/auth/logout');
}

export async function getInstruments(
  params?: GetInstrumentsParams,
): Promise<{ instruments: Instrument[] }> {
  return apiClient.get('/api/instruments', { params });
}

export async function getInstrument(
  id: string,
): Promise<{ instrument: Instrument; owner: SessionUser }> {
  return apiClient.get(`/api/instruments/${id}`);
}

export async function createInstrument(
  formData: FormData,
): Promise<{ instrument: Instrument }> {
  return apiClient.post('/api/instruments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function deleteInstrument(id: string): Promise<{ success: boolean }> {
  return apiClient.delete(`/api/instruments/${id}`);
}

export async function getOrders(role?: 'sent' | 'received'): Promise<{ orders: Order[] }> {
  return apiClient.get('/api/orders', { params: role ? { role } : undefined });
}

export async function createOrder(data: CreateOrderData): Promise<{ order: Order }> {
  return apiClient.post('/api/orders', data);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<{ order: Order }> {
  return apiClient.patch(`/api/orders/${id}/status`, { status });
}
