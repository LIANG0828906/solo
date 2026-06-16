import { create } from 'zustand';
import type { User, Book, Chapter, Review } from './types';
import * as db from './db';
import { v4 as uuidv4 } from 'uuid';

export function computeFilteredBooks(
  books: Book[],
  searchQuery: string,
  sortOrder: 'desc' | 'asc'
): Book[] {
  let result = books.filter((book) => {
    const query = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    );
  });
  result = result.sort((a, b) => {
    if (sortOrder === 'desc') {
      return b.avgRating - a.avgRating;
    }
    return a.avgRating - b.avgRating;
  });
  return result;
}

export function computePaginatedBooks(
  filteredBooks: Book[],
  currentPage: number,
  pageSize: number
): Book[] {
  const start = (currentPage - 1) * pageSize;
  return filteredBooks.slice(start, start + pageSize);
}

export function computeTotalPages(
  filteredBooks: Book[],
  pageSize: number
): number {
  return Math.ceil(filteredBooks.length / pageSize);
}

interface StoreState {
  currentUser: User | null;
  books: Book[];
  currentBook: Book | null;
  chapters: Chapter[];
  reviews: Review[];
  searchQuery: string;
  sortOrder: 'desc' | 'asc';
  currentPage: number;
  pageSize: number;
  expandedChapterId: string | null;
  loadBooks: () => Promise<void>;
  setCurrentBook: (bookId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSortOrder: (order: 'desc' | 'asc') => void;
  setCurrentPage: (page: number) => void;
  toggleChapter: (chapterId: string) => void;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addReview: (bookId: string, rating: 1 | 2 | 3 | 4 | 5, content: string) => Promise<boolean>;
  toggleLikeReview: (reviewId: string) => Promise<void>;
  updateProfile: (username: string, avatarColor: string) => Promise<boolean>;
  getUserByUsername: (username: string) => Promise<User | null>;
  getUserReviews: (userId: string) => Promise<Review[]>;
}

export const useStore = create<StoreState>((set, get) => ({
  currentUser: null,
  books: [],
  currentBook: null,
  chapters: [],
  reviews: [],
  searchQuery: '',
  sortOrder: 'desc',
  currentPage: 1,
  pageSize: 12,
  expandedChapterId: null,

  loadBooks: async () => {
    const books = await db.getAllBooks();
    set({ books });
  },

  setCurrentBook: async (bookId: string) => {
    const [book, chapters, reviews] = await Promise.all([
      db.getBookById(bookId),
      db.getChaptersByBookId(bookId),
      db.getReviewsByBookId(bookId),
    ]);
    set({
      currentBook: book || null,
      chapters,
      reviews,
      expandedChapterId: null,
    });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query, currentPage: 1 });
  },

  setSortOrder: (order: 'desc' | 'asc') => {
    set({ sortOrder: order });
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: page });
  },

  toggleChapter: (chapterId: string) => {
    const { expandedChapterId } = get();
    set({
      expandedChapterId: expandedChapterId === chapterId ? null : chapterId,
    });
  },

  login: async (username: string, password: string) => {
    const user = await db.getUserByUsername(username);
    if (user && user.password === password) {
      set({ currentUser: user });
      return true;
    }
    return false;
  },

  register: async (username: string, password: string) => {
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return false;
    }
    const newUser = await db.createUser({
      username,
      password,
      avatarColor: '#2C3E50',
    });
    set({ currentUser: newUser });
    return true;
  },

  logout: () => {
    set({ currentUser: null });
  },

  addReview: async (bookId: string, rating: 1 | 2 | 3 | 4 | 5, content: string) => {
    const { currentUser, books } = get();
    if (!currentUser) {
      return false;
    }
    const newReview = await db.addReview({
      bookId,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatarColor: currentUser.avatarColor,
      rating,
      content,
      likedBy: [],
    });
    const updatedReviews = [newReview, ...get().reviews];
    const updatedBooks = books.map((book) => {
      if (book.id === bookId) {
        const bookReviews = updatedReviews.filter((r) => r.bookId === bookId);
        const reviewCount = bookReviews.length;
        const avgRating = reviewCount > 0
          ? bookReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
          : 0;
        return {
          ...book,
          reviewCount,
          avgRating: Math.round(avgRating * 10) / 10,
        };
      }
      return book;
    });
    set({
      reviews: updatedReviews,
      books: updatedBooks,
      currentBook: updatedBooks.find((b) => b.id === bookId) || null,
    });
    return true;
  },

  toggleLikeReview: async (reviewId: string) => {
    const { currentUser, reviews } = get();
    if (!currentUser) return;

    const reviewIndex = reviews.findIndex((r) => r.id === reviewId);
    if (reviewIndex === -1) return;

    const updatedReview = await db.updateReviewLikes(reviewId, currentUser.id);

    const updatedReviews = [...reviews];
    updatedReviews[reviewIndex] = updatedReview;
    set({ reviews: updatedReviews });
  },

  updateProfile: async (username: string, avatarColor: string) => {
    const { currentUser } = get();
    if (!currentUser) return false;

    if (username !== currentUser.username) {
      const existingUser = await db.getUserByUsername(username);
      if (existingUser) {
        return false;
      }
    }

    const updatedUser: User = {
      ...currentUser,
      username,
      avatarColor,
    };
    await db.updateUser(updatedUser);
    set({ currentUser: updatedUser });
    return true;
  },

  getUserByUsername: async (username: string) => {
    const user = await db.getUserByUsername(username);
    return user || null;
  },

  getUserReviews: async (userId: string) => {
    return db.getUserReviews(userId);
  },
}));
