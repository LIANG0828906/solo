import type { Recipe, Order, Stock, ReportData, CalculationResult } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getRecipes: () => request<Recipe[]>('/recipes'),
  createRecipe: (data: Omit<Recipe, 'id'>) =>
    request<Recipe>('/recipes', { method: 'POST', body: JSON.stringify(data) }),
  deleteRecipe: (id: string) => request<{ success: boolean }>(`/recipes/${id}`, { method: 'DELETE' }),

  getOrders: () => request<Order[]>('/orders'),
  createOrder: (data: { customerName: string; items: { recipeId: string; quantity: number }[] }) =>
    request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, status: 'pending' | 'completed') =>
    request<Order>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteOrder: (id: string) => request<{ success: boolean }>(`/orders/${id}`, { method: 'DELETE' }),
  calculateIngredients: (items: { recipeId: string; quantity: number }[]) =>
    request<CalculationResult>('/orders/calculate', { method: 'POST', body: JSON.stringify({ items }) }),

  getStocks: () => request<Stock[]>('/stocks'),
  updateStock: (id: string, data: Partial<Stock>) =>
    request<Stock>(`/stocks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getReports: () => request<ReportData>('/reports'),
};
