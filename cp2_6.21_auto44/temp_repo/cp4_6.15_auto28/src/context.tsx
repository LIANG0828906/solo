import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { Book, Toast, ToastType } from './types';
import { BookStorage } from './BookStorage';

interface AppContextType {
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
  refreshBooks: () => void;
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const refreshBooks = useCallback(() => {
    setBooks(BookStorage.getBooks());
  }, []);

  useEffect(() => {
    refreshBooks();
  }, [refreshBooks]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now().toString(36);
    const toast: Toast = { id, message, type };
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      books,
      setBooks,
      refreshBooks,
      toasts,
      showToast,
      removeToast,
      mobileMenuOpen,
      setMobileMenuOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
