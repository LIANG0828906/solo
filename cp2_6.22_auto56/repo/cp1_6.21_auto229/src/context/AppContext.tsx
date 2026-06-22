import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { Book, BookList, BorrowRecord, ActiveView } from '../types';

interface AppState {
  books: Book[];
  lists: BookList[];
  borrows: BorrowRecord[];
  activeView: ActiveView;
  setActiveView: (v: ActiveView) => void;
  refreshBooks: () => Promise<void>;
  refreshLists: () => Promise<void>;
  refreshBorrows: () => Promise<void>;
  addBook: (book: Omit<Book, 'id' | 'addedAt' | 'status' | 'rating' | 'tags'>) => Promise<Book>;
  updateBook: (id: string, data: Partial<Pick<Book, 'status' | 'rating' | 'tags'>>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  createList: (name: string, description: string) => Promise<BookList>;
  deleteList: (id: string) => Promise<void>;
  addBookToList: (listId: string, bookId: string) => Promise<void>;
  removeBookFromList: (listId: string, bookId: string) => Promise<void>;
  reorderListBooks: (listId: string, bookIds: string[]) => Promise<void>;
  createBorrow: (data: Omit<BorrowRecord, 'id' | 'returned' | 'actualReturnDate'>) => Promise<void>;
  returnBorrow: (id: string) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [lists, setLists] = useState<BookList[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('search');

  const refreshBooks = useCallback(async () => {
    const { data } = await axios.get('/api/books');
    setBooks(data);
  }, []);

  const refreshLists = useCallback(async () => {
    const { data } = await axios.get('/api/lists');
    setLists(data);
  }, []);

  const refreshBorrows = useCallback(async () => {
    const { data } = await axios.get('/api/borrows');
    setBorrows(data);
  }, []);

  useEffect(() => { refreshBooks(); }, [refreshBooks]);
  useEffect(() => { refreshLists(); }, [refreshLists]);
  useEffect(() => { refreshBorrows(); }, [refreshBorrows]);

  const addBook = useCallback(async (book: Omit<Book, 'id' | 'addedAt' | 'status' | 'rating' | 'tags'>) => {
    const { data } = await axios.post('/api/books', book);
    await refreshBooks();
    return data;
  }, [refreshBooks]);

  const updateBook = useCallback(async (id: string, data: Partial<Pick<Book, 'status' | 'rating' | 'tags'>>) => {
    await axios.put(`/api/books/${id}`, data);
    await refreshBooks();
  }, [refreshBooks]);

  const deleteBook = useCallback(async (id: string) => {
    await axios.delete(`/api/books/${id}`);
    await refreshBooks();
  }, [refreshBooks]);

  const createList = useCallback(async (name: string, description: string) => {
    const { data } = await axios.post('/api/lists', { name, description });
    await refreshLists();
    return data;
  }, [refreshLists]);

  const deleteList = useCallback(async (id: string) => {
    await axios.delete(`/api/lists/${id}`);
    await refreshLists();
  }, [refreshLists]);

  const addBookToList = useCallback(async (listId: string, bookId: string) => {
    await axios.post(`/api/lists/${listId}/books`, { bookId });
    await refreshLists();
  }, [refreshLists]);

  const removeBookFromList = useCallback(async (listId: string, bookId: string) => {
    await axios.delete(`/api/lists/${listId}/books/${bookId}`);
    await refreshLists();
  }, [refreshLists]);

  const reorderListBooks = useCallback(async (listId: string, bookIds: string[]) => {
    await axios.put(`/api/lists/${listId}/books/reorder`, { bookIds });
    await refreshLists();
  }, [refreshLists]);

  const createBorrow = useCallback(async (data: Omit<BorrowRecord, 'id' | 'returned' | 'actualReturnDate'>) => {
    await axios.post('/api/borrows', data);
    await refreshBorrows();
  }, [refreshBorrows]);

  const returnBorrow = useCallback(async (id: string) => {
    await axios.put(`/api/borrows/${id}/return`);
    await refreshBorrows();
  }, [refreshBorrows]);

  return (
    <AppContext.Provider value={{
      books, lists, borrows, activeView, setActiveView,
      refreshBooks, refreshLists, refreshBorrows,
      addBook, updateBook, deleteBook,
      createList, deleteList, addBookToList, removeBookFromList, reorderListBooks,
      createBorrow, returnBorrow,
    }}>
      {children}
    </AppContext.Provider>
  );
}
