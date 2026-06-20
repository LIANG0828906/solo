import axios from 'axios';
import type { Product } from '../types';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getGoodsList = async (category?: string): Promise<Product[]> => {
  const params = category ? { category } : {};
  const response = await api.get<Product[]>('/goods', { params });
  return response.data;
};

export const addToCart = async (productId: number, quantity: number): Promise<any> => {
  const response = await api.post('/cart', { productId, quantity });
  return response.data;
};

export const updateStock = async (productId: number, stock: number): Promise<Product> => {
  const response = await api.patch<Product>(`/goods/${productId}/stock`, { stock });
  return response.data;
};

export const createProduct = async (data: Omit<Product, 'id'>): Promise<Product> => {
  const response = await api.post<Product>('/goods', data);
  return response.data;
};

export const updateProduct = async (id: number, data: Partial<Product>): Promise<Product> => {
  const response = await api.put<Product>(`/goods/${id}`, data);
  return response.data;
};

export const getProduct = async (id: number): Promise<Product> => {
  const response = await api.get<Product>(`/goods/${id}`);
  return response.data;
};

export default api;
