export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  supplier: string;
  stock: number;
  threshold: number;
  price: number;
  image: string;
  salesHistory: number[];
  status: StockStatus;
}

export interface RestockSuggestion {
  productId: string;
  product: Product;
  currentStock: number;
  threshold: number;
  suggestedQuantity: number;
  unitPrice: number;
  subtotal: number;
  quantity?: number;
}

export type StockStatus = 'normal' | 'warning' | 'outOfStock';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  getProducts: () => request<Product[]>('/products'),
  getProduct: (id: string) => request<Product>(`/products/${id}`),
  setThreshold: (id: string, threshold: number) =>
    request<Product>(`/products/${id}/threshold`, {
      method: 'POST',
      body: JSON.stringify({ threshold }),
    }),
  getRestockSuggestions: (productIds: string[]) =>
    request<RestockSuggestion[]>('/restock/suggest', {
      method: 'POST',
      body: JSON.stringify({ productIds }),
    }),
  submitOrder: (items: RestockSuggestion[]) =>
    request<{ success: boolean; orderId: string; message: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
};
