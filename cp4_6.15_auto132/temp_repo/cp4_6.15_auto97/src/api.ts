import type { Book, User, Order, Borrow, CartItem, ApiResponse, StatsData } from './types';

const BASE_URL = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: '网络请求失败' };
  }
}

export const fetchBooks = (): Promise<ApiResponse<Book[]>> =>
  request<Book[]>('/books');

export const fetchBook = (id: string): Promise<ApiResponse<Book>> =>
  request<Book>(`/books/${id}`);

export const searchBooks = (query: string): Promise<ApiResponse<Book[]>> =>
  request<Book[]>(`/books/search?q=${encodeURIComponent(query)}`);

export const addBook = (book: Omit<Book, 'id' | 'createdAt'>): Promise<ApiResponse<Book>> =>
  request<Book>('/books', { method: 'POST', body: JSON.stringify(book) });

export const updateBook = (id: string, book: Partial<Book>): Promise<ApiResponse<Book>> =>
  request<Book>(`/books/${id}`, { method: 'PUT', body: JSON.stringify(book) });

export const deleteBook = (id: string): Promise<ApiResponse<{ removed: boolean }>> =>
  request<{ removed: boolean }>(`/books/${id}`, { method: 'DELETE' });

export const login = (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> =>
  request<{ user: User; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const register = (
  username: string,
  email: string,
  password: string
): Promise<ApiResponse<{ user: User; token: string }>> =>
  request<{ user: User; token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });

export const fetchOrders = (userId: string): Promise<ApiResponse<Order[]>> =>
  request<Order[]>('/orders', { headers: { 'x-user-id': userId } });

export const fetchOrder = (id: string): Promise<ApiResponse<Order>> =>
  request<Order>(`/orders/${id}`);

export const submitOrder = (
  items: CartItem[],
  address: { name: string; phone: string; address: string },
  paymentMethod: string,
  userId: string
): Promise<ApiResponse<Order>> =>
  request<Order>('/orders', {
    method: 'POST',
    headers: { 'x-user-id': userId },
    body: JSON.stringify({ items, address, paymentMethod }),
  });

export const updateOrderStatus = (id: string, status: Order['status']): Promise<ApiResponse<Order>> =>
  request<Order>(`/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

export const fetchBorrows = (userId: string): Promise<ApiResponse<Borrow[]>> =>
  request<Borrow[]>('/borrows', { headers: { 'x-user-id': userId } });

export const fetchAllBorrows = (): Promise<ApiResponse<Borrow[]>> =>
  request<Borrow[]>('/borrows/admin');

export const createBorrow = (
  userId: string,
  bookId: string,
  book: Book
): Promise<ApiResponse<Borrow>> =>
  request<Borrow>('/borrows', {
    method: 'POST',
    body: JSON.stringify({ userId, bookId, book }),
  });

export const renewBorrow = (id: string): Promise<ApiResponse<Borrow>> =>
  request<Borrow>(`/borrows/${id}/renew`, { method: 'PUT' });

export const returnBorrow = (id: string): Promise<ApiResponse<Borrow>> =>
  request<Borrow>(`/borrows/${id}/return`, { method: 'PUT' });

export const fetchStats = (): Promise<ApiResponse<StatsData>> =>
  request<StatsData>('/admin/stats');
