import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Book, ReadingStatus, ReadingPlan, LibraryContextType, BuiltInBook } from '@/types';
import { builtInBooks, getBookByIsbn } from '@/data/mockBooks';
import { saveBooks, loadBooks, savePlan, loadPlan } from '@/utils/storage';
import { getCurrentMonth } from '@/utils/priority';

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [plan, setPlan] = useState<ReadingPlan | null>(() => loadPlan());
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  useEffect(() => {
    saveBooks(books);
  }, [books]);

  useEffect(() => {
    savePlan(plan);
  }, [plan]);

  const addBook = useCallback((bookData: Omit<Book, 'id' | 'createdAt' | 'status' | 'priority' | 'notes'>) => {
    const wantToReadBooks = books.filter((b) => b.status === 'want-to-read');
    const newBook: Book = {
      ...bookData,
      id: uuidv4(),
      status: 'want-to-read',
      priority: wantToReadBooks.length,
      notes: '',
      createdAt: new Date().toISOString(),
    };
    setBooks((prev) => [...prev, newBook]);
  }, [books]);

  const updateBook = useCallback((id: string, updates: Partial<Book>) => {
    setBooks((prev) => prev.map((book) => (book.id === id ? { ...book, ...updates } : book)));
  }, []);

  const deleteBook = useCallback((id: string) => {
    setBooks((prev) => prev.filter((book) => book.id !== id));
    setSelectedBookId((prev) => (prev === id ? null : prev));
    setPlan((prevPlan) => {
      if (!prevPlan) return null;
      return { ...prevPlan, bookIds: prevPlan.bookIds.filter((bid) => bid !== id) };
    });
  }, []);

  const selectBook = useCallback((id: string | null) => {
    setSelectedBookId(id);
  }, []);

  const updateBookStatus = useCallback((id: string, status: ReadingStatus) => {
    setBooks((prev) => {
      return prev.map((book) => {
        if (book.id !== id) return book;
        if (book.status === status) return book;

        const updated = { ...book, status };

        if (status === 'want-to-read') {
          const wantToReadCount = prev.filter(
            (b) => b.status === 'want-to-read' && b.id !== id
          ).length;
          updated.priority = wantToReadCount;
        }

        return updated;
      });
    });
  }, []);

  const reorderWantToRead = useCallback((startIndex: number, endIndex: number) => {
    setBooks((prev) => {
      const wantToReadBooks = prev
        .filter((b) => b.status === 'want-to-read')
        .sort((a, b) => a.priority - b.priority);

      const [removed] = wantToReadBooks.splice(startIndex, 1);
      wantToReadBooks.splice(endIndex, 0, removed);

      const updatedWantToRead = wantToReadBooks.map((book, index) => ({
        ...book,
        priority: index,
      }));

      const otherBooks = prev.filter((b) => b.status !== 'want-to-read');

      return [...otherBooks, ...updatedWantToRead];
    });
  }, []);

  const generateMonthlyPlan = useCallback(() => {
    const topBooks = books
      .filter((b) => b.status === 'want-to-read')
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 5);

    const newPlan: ReadingPlan = {
      id: uuidv4(),
      month: getCurrentMonth(),
      bookIds: topBooks.map((b) => b.id),
      createdAt: new Date().toISOString(),
    };
    setPlan(newPlan);
  }, [books]);

  const updatePlan = useCallback((bookIds: string[]) => {
    setPlan((prev) => {
      if (!prev) return null;
      return { ...prev, bookIds };
    });
  }, []);

  const addBookToPlan = useCallback((bookId: string) => {
    setPlan((prev) => {
      if (!prev) return null;
      if (prev.bookIds.includes(bookId)) return prev;
      return { ...prev, bookIds: [...prev.bookIds, bookId] };
    });
  }, []);

  const removeBookFromPlan = useCallback((bookId: string) => {
    setPlan((prev) => {
      if (!prev) return null;
      return { ...prev, bookIds: prev.bookIds.filter((id) => id !== bookId) };
    });
  }, []);

  const batchImportBooks = useCallback(async (isbns: string[]) => {
    const progress: { success: number; failed: number; progress: number }[] = [];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < isbns.length; i++) {
      const isbn = isbns[i].trim();
      if (!isbn) {
        failed++;
        progress.push({ success, failed, progress: ((i + 1) / isbns.length) * 100 });
        continue;
      }

      const builtInBook = getBookByIsbn(isbn);
      if (builtInBook) {
        const exists = books.some((b) => b.isbn === isbn);
        if (!exists) {
          const wantToReadCount = books.filter((b) => b.status === 'want-to-read').length + success;
          const newBook: Book = {
            id: uuidv4(),
            title: builtInBook.title,
            author: builtInBook.author,
            isbn: builtInBook.isbn,
            publishYear: builtInBook.publishYear,
            coverUrl: builtInBook.coverUrl,
            status: 'want-to-read',
            priority: wantToReadCount,
            difficulty: builtInBook.difficulty,
            notes: '',
            createdAt: new Date().toISOString(),
          };
          setBooks((prev) => [...prev, newBook]);
          success++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }

      progress.push({ success, failed, progress: ((i + 1) / isbns.length) * 100 });
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return progress;
  }, [books]);

  const searchBooks = useCallback((query: string): Book[] => {
    if (!query.trim()) return books;
    const lowerQuery = query.toLowerCase();
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(lowerQuery) ||
        book.author.toLowerCase().includes(lowerQuery) ||
        (book.isbn && book.isbn.includes(query.trim()))
    );
  }, [books]);

  const getBuiltInBooks = useCallback((): BuiltInBook[] => {
    return builtInBooks;
  }, []);

  const value = useMemo(
    () => ({
      books,
      plan,
      selectedBookId,
      addBook,
      updateBook,
      deleteBook,
      selectBook,
      updateBookStatus,
      reorderWantToRead,
      generateMonthlyPlan,
      updatePlan,
      addBookToPlan,
      removeBookFromPlan,
      batchImportBooks,
      searchBooks,
      getBuiltInBooks,
    }),
    [
      books,
      plan,
      selectedBookId,
      addBook,
      updateBook,
      deleteBook,
      selectBook,
      updateBookStatus,
      reorderWantToRead,
      generateMonthlyPlan,
      updatePlan,
      addBookToPlan,
      removeBookFromPlan,
      batchImportBooks,
      searchBooks,
      getBuiltInBooks,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
