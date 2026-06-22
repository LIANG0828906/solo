import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Book, Reader, BorrowRecord, AppContextType } from '@/types';
import { mockBooks, mockReaders, mockBorrowRecords } from '@/data/mockData';

const AppContext = createContext<AppContextType | undefined>(undefined);

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

const coverColors = ['#8B4513', '#2F4F4F', '#556B2F', '#4B0082', '#800000', '#191970', '#2E8B57', '#8B008B', '#B8860B', '#CD5C5C'];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>(mockBooks);
  const [readers, setReaders] = useState<Reader[]>(mockReaders);
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>(mockBorrowRecords);

  useEffect(() => {
    const interval = setInterval(() => {
      setBorrowRecords(prev => prev.map(record => {
        if (!record.returnDate && !record.isOverdue) {
          return { ...record, isOverdue: new Date() > record.dueDate };
        }
        return record;
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const addBook = useCallback((bookData: Omit<Book, 'id' | 'borrowCount' | 'coverColor' | 'hotLevel'>) => {
    const newBook: Book = {
      ...bookData,
      id: generateId(),
      borrowCount: 0,
      coverColor: coverColors[Math.floor(Math.random() * coverColors.length)],
      hotLevel: 1,
    };
    setBooks(prev => [...prev, newBook]);
  }, []);

  const addReader = useCallback((readerData: Omit<Reader, 'id' | 'borrowCount' | 'overdueCount'>) => {
    const newReader: Reader = {
      ...readerData,
      id: generateId(),
      borrowCount: 0,
      overdueCount: 0,
    };
    setReaders(prev => [...prev, newReader]);
  }, []);

  const borrowBook = useCallback((readerId: string, bookId: string): boolean => {
    const book = books.find(b => b.id === bookId);
    if (!book || book.stock <= 0) return false;

    const borrowDate = new Date();
    const dueDate = new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const newRecord: BorrowRecord = {
      id: generateId(),
      readerId,
      bookId,
      borrowDate,
      dueDate,
      isOverdue: false,
    };

    setBorrowRecords(prev => [...prev, newRecord]);
    setBooks(prev => prev.map(b => 
      b.id === bookId 
        ? { ...b, stock: b.stock - 1, borrowCount: b.borrowCount + 1, hotLevel: Math.min(5, Math.floor((b.borrowCount + 1) / 20) + 1) }
        : b
    ));
    setReaders(prev => prev.map(r => 
      r.id === readerId 
        ? { 
            ...r, 
            borrowCount: r.borrowCount + 1,
            preferredCategories: Array.from(new Set([...r.preferredCategories, book.category])).slice(0, 3),
            preferredAuthors: Array.from(new Set([...r.preferredAuthors, book.author])).slice(0, 3),
          }
        : r
    ));
    return true;
  }, [books]);

  const returnBook = useCallback((recordId: string) => {
    const record = borrowRecords.find(r => r.id === recordId);
    if (!record || record.returnDate) return;

    const now = new Date();
    const isOverdue = now > record.dueDate;

    setBorrowRecords(prev => prev.map(r => 
      r.id === recordId ? { ...r, returnDate: now, isOverdue } : r
    ));
    setBooks(prev => prev.map(b => 
      b.id === record.bookId ? { ...b, stock: b.stock + 1 } : b
    ));
    if (isOverdue) {
      setReaders(prev => prev.map(r => 
        r.id === record.readerId ? { ...r, overdueCount: r.overdueCount + 1 } : r
      ));
    }
  }, [borrowRecords]);

  const searchBooks = useCallback((keyword: string): Book[] => {
    if (!keyword.trim()) return books;
    const lowerKeyword = keyword.toLowerCase();
    return books.filter(book => 
      book.title.toLowerCase().includes(lowerKeyword) ||
      book.author.toLowerCase().includes(lowerKeyword) ||
      book.category.toLowerCase().includes(lowerKeyword)
    );
  }, [books]);

  const getRecommendations = useCallback((readerId: string, limit: number = 10): Book[] => {
    const reader = readers.find(r => r.id === readerId);
    if (!reader) return getHotBooks(limit);

    const readerBorrowedIds = new Set(
      borrowRecords.filter(r => r.readerId === readerId).map(r => r.bookId)
    );

    const availableBooks = books.filter(b => 
      !readerBorrowedIds.has(b.id) && b.stock > 0
    );

    const scoredBooks = availableBooks.map(book => {
      let score = 0;
      if (reader.preferredCategories.includes(book.category)) score += 30;
      if (reader.preferredAuthors.includes(book.author)) score += 20;
      score += book.hotLevel * 5;
      score += Math.min(book.borrowCount, 50);
      return { book, score };
    });

    scoredBooks.sort((a, b) => b.score - a.score);
    return scoredBooks.slice(0, limit).map(sb => sb.book);
  }, [books, readers, borrowRecords]);

  const getHotBooks = useCallback((limit: number = 10): Book[] => {
    return [...books]
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, limit);
  }, [books]);

  const checkOverdue = useCallback((): BorrowRecord[] => {
    const now = new Date();
    return borrowRecords.filter(record => 
      !record.returnDate && now > record.dueDate
    );
  }, [borrowRecords]);

  const getStats = useCallback(() => {
    const totalBooks = books.reduce((sum, b) => sum + b.stock, 0);
    const totalReaders = readers.length;
    const borrowedBooks = borrowRecords.filter(r => !r.returnDate).length;
    const overdueBooks = borrowRecords.filter(r => !r.returnDate && r.isOverdue).length;
    return { totalBooks, totalReaders, borrowedBooks, overdueBooks };
  }, [books, readers, borrowRecords]);

  const value = useMemo<AppContextType>(() => ({
    books,
    readers,
    borrowRecords,
    addBook,
    addReader,
    borrowBook,
    returnBook,
    searchBooks,
    getRecommendations,
    getHotBooks,
    checkOverdue,
    getStats,
  }), [books, readers, borrowRecords, addBook, addReader, borrowBook, returnBook, searchBooks, getRecommendations, getHotBooks, checkOverdue, getStats]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
