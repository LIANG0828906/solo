import axios from 'axios';
import type {
  User,
  Book,
  BookWithDetails,
  Borrow,
  Review,
  Notification,
} from '../types';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ token: string; user: User }>('/auth/login', { email, password }),
  register: (username: string, email: string, password: string) =>
    apiClient.post<{ token: string; user: User }>('/auth/register', { username, email, password }),
  getProfile: () => apiClient.get<User>('/auth/profile'),
};

export const booksApi = {
  getBooks: (params?: {
    search?: string;
    minRating?: number;
    minBorrowCount?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get<{ books: Book[]; total: number }>('/books', { params }),
  getBook: (id: string) => apiClient.get<BookWithDetails>(`/books/${id}`),
  createBook: (data: {
    title: string;
    author: string;
    cover_url?: string;
    max_borrow_days: number;
    max_borrow_count: number;
  }) => apiClient.post<Book>('/books', data),
  updateBook: (id: string, data: Partial<Book>) =>
    apiClient.patch<Book>(`/books/${id}`, data),
  getUserBooks: (userId: string) =>
    apiClient.get<Book[]>(`/users/${userId}/books`),
};

export const borrowsApi = {
  createBorrow: (data: {
    book_id: string;
    borrow_days: number;
    reason: string;
  }) => apiClient.post<Borrow>('/borrows', data),
  updateBorrow: (id: string, data: { status: 'approved' | 'rejected' }) =>
    apiClient.patch<Borrow>(`/borrows/${id}`, data),
  returnBorrow: (id: string) => apiClient.post<Borrow>(`/borrows/${id}/return`),
  getPendingBorrows: () => apiClient.get<Borrow[]>('/borrows/pending'),
};

export const reviewsApi = {
  createReview: (data: {
    borrow_id: string;
    book_id: string;
    reviewee_id: string;
    rating: number;
    comment: string;
  }) => apiClient.post<Review>('/reviews', data),
  getUserReviews: (userId: string) =>
    apiClient.get<Review[]>(`/users/${userId}/reviews`),
};

export const notificationsApi = {
  getNotifications: () => apiClient.get<Notification[]>('/notifications'),
  markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/read-all'),
};

export const usersApi = {
  getUser: (id: string) => apiClient.get<User>(`/users/${id}`),
};

export default apiClient;
