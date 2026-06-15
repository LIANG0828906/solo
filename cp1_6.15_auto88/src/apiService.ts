import type { Book, BorrowRecord, ApiResponse } from './types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.success) {
    throw new Error(json.message || '请求失败');
  }
  return json.data as T;
}

export const apiService = {
  searchBooks(keyword = ''): Promise<Book[]> {
    const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
    return request<Book[]>(`/books${query}`);
  },

  getBookDetails(id: string): Promise<Book> {
    return request<Book>(`/books/${id}`);
  },

  borrowBook(id: string, borrower: string): Promise<Book> {
    return request<Book>(`/books/${id}/borrow`, {
      method: 'POST',
      body: JSON.stringify({ borrower }),
    });
  },

  returnBook(id: string): Promise<Book> {
    return request<Book>(`/books/${id}/return`, {
      method: 'POST',
    });
  },

  getHistory(bookId: string): Promise<BorrowRecord[]> {
    return request<BorrowRecord[]>(`/books/${bookId}/history`);
  },
};

export default apiService;
