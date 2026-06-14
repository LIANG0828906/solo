export interface Book {
  id: string;
  title: string;
  author: string;
  courseCode: string;
  coverImage: string;
  images: string[];
  condition: '全新' | '九成新' | '八成新' | '七成新' | '一般';
  originalPrice: number;
  expectedPrice?: number;
  wantExchange?: string[];
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerBio: string;
  contactInfo: string;
  status: 'active' | 'sold' | 'exchanged' | 'offline';
  createdAt: string;
}

export interface ExchangeRequest {
  id: string;
  bookId: string;
  type: 'exchange' | 'buy';
  offerBookTitle?: string;
  offerBookAuthor?: string;
  offerPrice?: number;
  message: string;
  contactInfo: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  contact: string;
  totalListings: number;
  successfulExchanges: number;
  rating: number;
  favorites: string[];
}

export interface UserStats {
  totalListings: number;
  successfulExchanges: number;
  rating: number;
}

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  getBooks: (page = 1, limit = 20, sort = 'newest') =>
    request<{ books: Book[]; total: number }>(`/books?page=${page}&limit=${limit}&sort=${sort}`),

  getBook: (id: string) => request<Book>(`/books/${id}`),

  createBook: (book: Omit<Book, 'id' | 'createdAt'>) =>
    request<{ id: string }>('/books', { method: 'POST', body: JSON.stringify(book) }),

  updateBook: (id: string, updates: Partial<Book>) =>
    request<{ success: boolean }>(`/books/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),

  deleteBook: (id: string) =>
    request<{ success: boolean }>(`/books/${id}`, { method: 'DELETE' }),

  createExchange: (bookId: string, exchange: Omit<ExchangeRequest, 'id' | 'createdAt' | 'status' | 'bookId'>) =>
    request<{ id: string }>(`/books/${bookId}/exchange`, {
      method: 'POST',
      body: JSON.stringify(exchange),
    }),

  getUserProfile: () =>
    request<{ profile: UserProfile; stats: UserStats }>('/user/profile'),

  getUserBooks: () => request<{ books: Book[] }>('/user/books'),

  getUserExchanges: () => request<{ exchanges: ExchangeRequest[] }>('/user/exchanges'),

  getFavoriteBooks: () => request<{ books: Book[] }>('/user/favorites'),

  toggleFavorite: (bookId: string) =>
    request<{ favorites: string[]; added: boolean }>(`/user/favorites/${bookId}`, { method: 'POST' }),
};
