import axios from 'axios';
import type { Book, CheckInRecord, Comment, Achievement, BookList, PaginatedResponse, CommentSortType } from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export async function getBookRecommendations(): Promise<Book[]> {
  return api.get('/books/recommendations');
}

export async function getBookById(id: string): Promise<Book> {
  return api.get(`/books/${id}`);
}

export async function getCheckInRecords(days: number = 30): Promise<CheckInRecord[]> {
  return api.get('/checkin', { params: { days } });
}

export async function submitCheckIn(data: Omit<CheckInRecord, 'id'>): Promise<CheckInRecord> {
  return api.post('/checkin', data);
}

export async function updateCheckIn(id: string, data: Partial<CheckInRecord>): Promise<CheckInRecord> {
  return api.put(`/checkin/${id}`, data);
}

export async function fetchComments(
  bookId: string,
  page: number = 1,
  limit: number = 10,
  sort: CommentSortType = 'latest'
): Promise<PaginatedResponse<Comment>> {
  return api.get('/comments', { params: { bookId, page, limit, sort } });
}

export async function submitComment(data: { bookId: string; content: string; parentId?: string }): Promise<Comment> {
  return api.post('/comments', data);
}

export async function likeComment(id: string): Promise<{ likes: number }> {
  return api.post(`/comments/${id}/like`);
}

export async function replyComment(id: string, content: string): Promise<Comment> {
  return api.post(`/comments/${id}/reply`, { content });
}

export async function getAchievements(): Promise<Achievement[]> {
  return api.get('/achievements');
}

export async function getBookLists(): Promise<BookList[]> {
  return api.get('/booklists');
}

export async function createBookList(data: { name: string; type: BookList['type'] }): Promise<BookList> {
  return api.post('/booklists', data);
}

export async function updateBookList(id: string, data: Partial<BookList>): Promise<BookList> {
  return api.put(`/booklists/${id}`, data);
}

export async function deleteBookList(id: string): Promise<void> {
  return api.delete(`/booklists/${id}`);
}

export async function addBookToBookList(listId: string, bookId: string): Promise<BookList> {
  return api.post(`/booklists/${listId}/books`, { bookId });
}

export async function reorderBookLists(orders: { id: string; order: number }[]): Promise<BookList[]> {
  return api.put('/booklists/reorder', { orders });
}
