export interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  supplier: string;
  alertThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  createdAt: string;
}

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getProducts: (params?: { category?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    return request<Product[]>(`/products${q.toString() ? `?${q.toString()}` : ''}`);
  },
  getProduct: (id: string) => request<Product>(`/products/${id}`),
  getAlertProducts: () => request<Product[]>('/products/alerts'),
  createProduct: (data: Partial<Product>) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }),

  getSales: (params?: { date?: string; category?: string }) => {
    const q = new URLSearchParams();
    if (params?.date) q.set('date', params.date);
    if (params?.category) q.set('category', params.category);
    return request<Sale[]>(`/sales${q.toString() ? `?${q.toString()}` : ''}`);
  },
  createSale: (data: { items: { productId: string; quantity: number }[] }) =>
    request<Sale>('/sales', { method: 'POST', body: JSON.stringify(data) }),
  deleteSale: (id: string) =>
    request<{ success: boolean; deleted: Sale }>(`/sales/${id}`, { method: 'DELETE' }),
  undoDeleteSale: (id: string) =>
    request<Sale>(`/sales/${id}/undo`, { method: 'PUT' })
};
