import axios from 'axios';
import type {
  LoginData,
  RegisterData,
  AuthResponse,
  Book,
  Review,
  Event,
  CommunityPost,
  AddBookData,
  AddReviewData,
  CreateEventData,
  UpdateProgressData,
} from '@/types';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data?.message || error.message);
  }
);

export const authAPI = {
  login: (data: LoginData): Promise<AuthResponse> => {
    return api.post('/auth/login', data);
  },

  register: (data: RegisterData): Promise<AuthResponse> => {
    return api.post('/auth/register', data);
  },

  getProfile: (): Promise<{ user: any }> => {
    return api.get('/auth/profile');
  },
};

export const booksAPI = {
  getBooks: (): Promise<{ books: Book[] }> => {
    return api.get('/books');
  },

  addBook: (data: AddBookData): Promise<{ book: Book }> => {
    return api.post('/books', data);
  },

  getBookDetail: (id: string): Promise<{ book: Book; reviews: Review[] }> => {
    return api.get(`/books/${id}`);
  },

  updateProgress: (data: UpdateProgressData): Promise<{ book: Book }> => {
    return api.patch(`/books/${data.bookId}/progress`, {
      progress: data.progress,
      currentPage: data.currentPage,
    });
  },

  deleteBook: (id: string): Promise<void> => {
    return api.delete(`/books/${id}`);
  },
};

export const reviewsAPI = {
  addReview: (data: AddReviewData): Promise<{ review: Review }> => {
    return api.post('/reviews', data);
  },

  getBookReviews: (bookId: string): Promise<{ reviews: Review[] }> => {
    return api.get(`/reviews/book/${bookId}`);
  },
};

export const eventsAPI = {
  getEvents: (): Promise<{ events: Event[] }> => {
    return api.get('/events');
  },

  createEvent: (data: CreateEventData): Promise<{ event: Event }> => {
    return api.post('/events', data);
  },

  joinEvent: (eventId: string): Promise<{ event: Event }> => {
    return api.post(`/events/${eventId}/join`);
  },

  leaveEvent: (eventId: string): Promise<{ event: Event }> => {
    return api.post(`/events/${eventId}/leave`);
  },
};

export const communityAPI = {
  getCommunityPosts: (): Promise<{ posts: CommunityPost[] }> => {
    return api.get('/community/posts');
  },

  createPost: (content: string, images?: string[]): Promise<{ post: CommunityPost }> => {
    return api.post('/community/posts', { content, images });
  },

  likePost: (postId: string): Promise<{ post: CommunityPost }> => {
    return api.post(`/community/posts/${postId}/like`);
  },
};

export default api;
