import axios from 'axios';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: '小说' | '科普' | '历史' | '哲学' | '艺术' | '其他';
  startDate: string;
  endDate: string;
  rating: number;
  review: string;
}

export interface FeedItem {
  id: string;
  userId: string;
  userName: string;
  bookTitle: string;
  review: string;
  category: string;
  timestamp: string;
}

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getBooks = async (q?: string): Promise<Book[]> => {
  try {
    const url = q ? `/books?q=${encodeURIComponent(q)}` : '/books';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('获取书籍列表失败:', error);
    throw error;
  }
};

export const addBook = async (book: Omit<Book, 'id'>): Promise<Book> => {
  try {
    const response = await api.post('/books', book);
    return response.data;
  } catch (error) {
    console.error('添加书籍失败:', error);
    throw error;
  }
};

export const getBookById = async (id: string): Promise<Book> => {
  try {
    const response = await api.get(`/books/${id}`);
    return response.data;
  } catch (error) {
    console.error('获取书籍详情失败:', error);
    throw error;
  }
};

export const getFeed = async (): Promise<FeedItem[]> => {
  try {
    const response = await api.get('/social/feed');
    return response.data;
  } catch (error) {
    console.error('获取动态失败:', error);
    throw error;
  }
};

export default api;
