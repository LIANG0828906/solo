import { create } from 'zustand';
import type { Book, Comment } from '../shared/types';

interface BookStore {
  books: Book[];
  selectedBook: Book | null;
  comments: Comment[];
  onlineCount: number;
  setBooks: (books: Book[]) => void;
  setSelectedBook: (book: Book | null) => void;
  setComments: (comments: Comment[]) => void;
  addComment: (comment: Comment) => void;
  setOnlineCount: (n: number) => void;
}

export const useBookStore = create<BookStore>((set) => ({
  books: [],
  selectedBook: null,
  comments: [],
  onlineCount: 0,

  setBooks: (books) => set({ books }),
  setSelectedBook: (book) => set({ selectedBook: book }),
  setComments: (comments) => set({ comments: comments.slice(0, 20) }),
  addComment: (comment) =>
    set((state) => ({
      comments: [comment, ...state.comments].slice(0, 20),
    })),
  setOnlineCount: (n) => set({ onlineCount: n }),
}));
