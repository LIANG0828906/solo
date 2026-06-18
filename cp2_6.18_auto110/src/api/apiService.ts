import type { Book, Order, OrderCreateRequest } from '@/types';

const BASE_URL = '/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getBooks(): Promise<Book[]> {
    return this.request<Book[]>('/books');
  }

  async getBook(id: string): Promise<Book> {
    return this.request<Book>(`/books/${id}`);
  }

  async createBook(formData: FormData): Promise<Book> {
    return this.request<Book>('/books', {
      method: 'POST',
      body: formData,
    });
  }

  async updateBook(id: string, formData: FormData): Promise<Book> {
    return this.request<Book>(`/books/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  async deleteBook(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/books/${id}`, {
      method: 'DELETE',
    });
  }

  async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/orders');
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  async createOrder(data: OrderCreateRequest): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
  }
}

export const apiService = new ApiService();
