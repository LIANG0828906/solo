import type { Book, ReadingRecord, ValidationResult, CategoryStats, MonthlyReadingStats, DailyPageStats } from './types';

const BOOKS_KEY = 'library_books';
const RECORDS_KEY = 'library_records';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function isValidISBN(isbn: string): boolean {
  if (!isbn) return true;
  const cleaned = isbn.replace(/[- ]/g, '').toUpperCase();
  const regex = /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)/;
  return regex.test(cleaned);
}

function validateBook(data: Partial<Book>): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!data.title?.trim()) {
    errors.title = '书名不能为空';
  }
  if (!data.author?.trim()) {
    errors.author = '作者不能为空';
  }
  if (!data.category?.trim()) {
    errors.category = '分类不能为空';
  }
  if (!data.totalPages || data.totalPages <= 0) {
    errors.totalPages = '总页数必须大于0';
  }
  if (data.isbn && !isValidISBN(data.isbn)) {
    errors.isbn = 'ISBN格式不正确';
  }
  if (!data.readingStatus) {
    errors.readingStatus = '阅读状态不能为空';
  }
  if (data.currentPage !== undefined && data.currentPage < 0) {
    errors.currentPage = '当前页数不能为负数';
  }
  if (data.currentPage !== undefined && data.totalPages && data.currentPage > data.totalPages) {
    errors.currentPage = '当前页数不能超过总页数';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export const BookStorage = {
  getBooks(): Book[] {
    const data = localStorage.getItem(BOOKS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getBook(id: string): Book | undefined {
    return this.getBooks().find(book => book.id === id);
  },

  addBook(bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Book {
    const books = this.getBooks();
    const now = new Date().toISOString();
    const newBook: Book = {
      ...bookData,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };
    books.push(newBook);
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    return newBook;
  },

  updateBook(id: string, updates: Partial<Book>): Book | undefined {
    const books = this.getBooks();
    const index = books.findIndex(book => book.id === id);
    if (index === -1) return undefined;
    
    books[index] = {
      ...books[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    return books[index];
  },

  deleteBook(id: string): boolean {
    const books = this.getBooks();
    const filtered = books.filter(book => book.id !== id);
    if (filtered.length === books.length) return false;
    
    localStorage.setItem(BOOKS_KEY, JSON.stringify(filtered));
    
    const records = this.getReadingRecords(id);
    if (records.length > 0) {
      const allRecords = this.getAllReadingRecords();
      const filteredRecords = allRecords.filter(r => r.bookId !== id);
      localStorage.setItem(RECORDS_KEY, JSON.stringify(filteredRecords));
    }
    
    return true;
  },

  searchBooks(keyword: string, filters?: { category?: string; status?: string }): Book[] {
    let books = this.getBooks();
    
    if (keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase();
      books = books.filter(book =>
        book.title.toLowerCase().includes(lowerKeyword) ||
        book.author.toLowerCase().includes(lowerKeyword)
      );
    }
    
    if (filters?.category) {
      books = books.filter(book => book.category === filters.category);
    }
    
    if (filters?.status) {
      books = books.filter(book => book.readingStatus === filters.status);
    }
    
    return books.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getAllCategories(): string[] {
    const books = this.getBooks();
    const categories = new Set(books.map(book => book.category));
    return Array.from(categories).sort();
  },

  getAllReadingRecords(): ReadingRecord[] {
    const data = localStorage.getItem(RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getReadingRecords(bookId: string): ReadingRecord[] {
    return this.getAllReadingRecords()
      .filter(record => record.bookId === bookId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addReadingRecord(recordData: Omit<ReadingRecord, 'id' | 'createdAt'>): ReadingRecord {
    const records = this.getAllReadingRecords();
    const newRecord: ReadingRecord = {
      ...recordData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    records.push(newRecord);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    
    const book = this.getBook(recordData.bookId);
    if (book && recordData.endPage > book.currentPage) {
      let newStatus = book.readingStatus;
      if (recordData.endPage >= book.totalPages) {
        newStatus = 'finished';
      } else if (book.readingStatus === 'unread') {
        newStatus = 'reading';
      }
      this.updateBook(recordData.bookId, {
        currentPage: recordData.endPage,
        readingStatus: newStatus
      });
    }
    
    return newRecord;
  },

  validateBook,

  exportData(): string {
    const data = {
      books: this.getBooks(),
      records: this.getAllReadingRecords(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  },

  importData(json: string): { imported: number; duplicates: string[]; errors: string[] } {
    const result = { imported: 0, duplicates: [] as string[], errors: [] as string[] };
    
    try {
      const data = JSON.parse(json);
      const existingBooks = this.getBooks();
      const existingRecords = this.getAllReadingRecords();
      
      if (!Array.isArray(data.books)) {
        result.errors.push('数据格式错误：缺少 books 数组');
        return result;
      }
      
      const newBooks: Book[] = [];
      const existingIsbns = new Set(existingBooks.map(b => b.isbn).filter(Boolean));
      
      for (const bookData of data.books) {
        const validation = validateBook(bookData);
        if (!validation.isValid) {
          result.errors.push(`图书 "${bookData.title || '未知'}" 验证失败: ${Object.values(validation.errors).join(', ')}`);
          continue;
        }
        
        if (bookData.isbn && existingIsbns.has(bookData.isbn)) {
          result.duplicates.push(bookData.isbn);
          continue;
        }
        
        const now = new Date().toISOString();
        newBooks.push({
          ...bookData,
          id: generateId(),
          createdAt: bookData.createdAt || now,
          updatedAt: bookData.updatedAt || now
        });
        
        if (bookData.isbn) {
          existingIsbns.add(bookData.isbn);
        }
        result.imported++;
      }
      
      if (newBooks.length > 0) {
        localStorage.setItem(BOOKS_KEY, JSON.stringify([...existingBooks, ...newBooks]));
      }
      
      if (Array.isArray(data.records)) {
        const newRecords: ReadingRecord[] = [];
        const bookIdMap = new Map<string, string>();
        newBooks.forEach(b => {
          if (b.isbn) bookIdMap.set(b.isbn, b.id);
        });
        
        for (const recordData of data.records) {
          if (recordData.bookId) {
            const originalBook = data.books.find((b: Book) => b.id === recordData.bookId);
            if (originalBook?.isbn && bookIdMap.has(originalBook.isbn)) {
              newRecords.push({
                ...recordData,
                id: generateId(),
                bookId: bookIdMap.get(originalBook.isbn)!,
                createdAt: recordData.createdAt || new Date().toISOString()
              });
            }
          }
        }
        
        if (newRecords.length > 0) {
          localStorage.setItem(RECORDS_KEY, JSON.stringify([...existingRecords, ...newRecords]));
        }
      }
      
    } catch (e) {
      result.errors.push(`JSON解析失败: ${e instanceof Error ? e.message : '未知错误'}`);
    }
    
    return result;
  },

  getCategoryStats(): CategoryStats[] {
    const books = this.getBooks();
    const total = books.length;
    if (total === 0) return [];
    
    const categoryMap = new Map<string, number>();
    books.forEach(book => {
      categoryMap.set(book.category, (categoryMap.get(book.category) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100)
    }));
  },

  getMonthlyReadingStats(): MonthlyReadingStats[] {
    const records = this.getAllReadingRecords();
    const monthlyMap = new Map<string, number>();
    
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, 0);
    }
    
    records.forEach(record => {
      const date = new Date(record.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap.has(key)) {
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + record.duration);
      }
    });
    
    return Array.from(monthlyMap.entries()).map(([month, minutes]) => ({
      month,
      hours: Math.round((minutes / 60) * 10) / 10
    }));
  },

  getDailyPageStats(): DailyPageStats[] {
    const records = this.getAllReadingRecords();
    const dailyMap = new Map<string, number>();
    
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyMap.set(key, 0);
    }
    
    records.forEach(record => {
      const date = new Date(record.date).toISOString().split('T')[0];
      if (dailyMap.has(date)) {
        const pages = record.endPage - record.startPage + 1;
        dailyMap.set(date, (dailyMap.get(date) || 0) + Math.max(0, pages));
      }
    });
    
    return Array.from(dailyMap.entries()).map(([date, pages]) => ({ date, pages }));
  }
};
