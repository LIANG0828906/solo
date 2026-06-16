import type { Book, Order, OrderStatus, StatsData } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { message?: string }).message || `HTTP ${response.status}: ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}

export function fetchBooks(): Promise<Book[]> {
  return request<Book[]>(`${API_BASE}/books`);
}

export function addBook(book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<Book> {
  return request<Book>(`${API_BASE}/books`, {
    method: 'POST',
    body: JSON.stringify(book),
  });
}

export function updateBook(id: string, book: Partial<Omit<Book, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Book> {
  return request<Book>(`${API_BASE}/books/${id}`, {
    method: 'PUT',
    body: JSON.stringify(book),
  });
}

export function deleteBook(id: string): Promise<void> {
  return request<void>(`${API_BASE}/books/${id}`, {
    method: 'DELETE',
  });
}

export function fetchOrders(): Promise<Order[]> {
  return request<Order[]>(`${API_BASE}/orders`);
}

export function createOrder(order: Omit<Order, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  return request<Order>(`${API_BASE}/orders`, {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return request<Order>(`${API_BASE}/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function fetchStats(): Promise<StatsData> {
  return request<StatsData>(`${API_BASE}/stats`);
}
