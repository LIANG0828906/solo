import axios from 'axios';
import type {
  Product,
  ProductDetail,
  ProductQuery,
  ProductsResponse,
  FeedbackResponse,
  RecommendationsResponse
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export async function getProducts(query: ProductQuery = {}): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  
  if (query.category && query.category !== 'all') {
    params.append('category', query.category);
  }
  if (query.minPrice !== undefined && query.minPrice !== null) {
    params.append('minPrice', String(query.minPrice));
  }
  if (query.maxPrice !== undefined && query.maxPrice !== null) {
    params.append('maxPrice', String(query.maxPrice));
  }
  if (query.minRating !== undefined && query.minRating !== null) {
    params.append('minRating', String(query.minRating));
  }
  if (query.sortBy) {
    params.append('sortBy', query.sortBy);
  }
  if (query.sortOrder) {
    params.append('sortOrder', query.sortOrder);
  }
  
  const response = await api.get<ProductsResponse>(`/products?${params.toString()}`);
  return response.data;
}

export async function getProductDetail(id: string): Promise<ProductDetail> {
  const response = await api.get<ProductDetail>(`/products/${id}`);
  return response.data;
}

export async function submitFeedback(id: string, type: 'like' | 'dislike'): Promise<FeedbackResponse> {
  const response = await api.post<FeedbackResponse>(`/products/${id}/feedback`, { type });
  return response.data;
}

export async function getRecommendations(): Promise<RecommendationsResponse> {
  const response = await api.get<RecommendationsResponse>('/recommendations');
  return response.data;
}

export default api;
