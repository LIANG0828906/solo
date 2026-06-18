import type { Book, SalesData } from '@/types';

const BASE_URL = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('网络请求失败，请检查网络连接');
  }
}

export function fetchBooks(): Promise<Book[]> {
  return request<Book[]>('/books');
}

export function createBook(
  book: Omit<Book, 'id' | 'createdAt' | 'dailySales'>
): Promise<Book> {
  return request<Book>('/books', {
    method: 'POST',
    body: JSON.stringify(book),
  });
}

export function updateBook(
  id: string,
  data: Partial<Book>
): Promise<Book> {
  return request<Book>(`/books/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteBook(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/books/${id}`, {
    method: 'DELETE',
  });
}

export function fetchSalesData(): Promise<SalesData> {
  return request<SalesData>('/sales');
}
