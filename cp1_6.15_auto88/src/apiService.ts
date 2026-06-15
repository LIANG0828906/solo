import type { Book, BorrowRecord, ApiResponse } from './types';

const BASE_URL = 'http://localhost:3001/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data: ApiResponse<T> = await response.json();
  if (!data.success) {
    throw new Error(data.message || '请求失败');
  }
  return data.data as T;
}

export const apiService = {
  getBooks: (keyword?: string): Promise<Book[]> => {
    const url = keyword
      ? `${BASE_URL}/books?keyword=${encodeURIComponent(keyword)}`
      : `${BASE_URL}/books`;
    return request<Book[]>(url);
  },

  getBook: (id: string): Promise<Book> => {
    return request<Book>(`${BASE_URL}/books/${id}`);
  },

  borrowBook: (id: string, borrower: string): Promise<Book> => {
    return request<Book>(`${BASE_URL}/books/${id}/borrow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ borrower }),
    });
  },

  returnBook: (id: string): Promise<Book> => {
    return request<Book>(`${BASE_URL}/books/${id}/return`, {
      method: 'POST',
    });
  },

  getHistory: (bookId: string): Promise<BorrowRecord[]> => {
    return request<BorrowRecord[]>(`${BASE_URL}/books/${bookId}/history`);
  },
};
