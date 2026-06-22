import type { Book, WishlistItem, BorrowRecord, SaleRecord, MatchResult, SearchFilters, BookCategory } from './types';
import { generateMockBooks, generateMockWishlist, generateMockBorrowRecords, generateMockSales } from './mockData';

type Listener = () => void;

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function calculateMatchScore(book: Book, wishItem: WishlistItem): number {
  const bookTitleChars = new Set(book.title.replace(/[（）()修订版]/g, ''));
  const wishTitleChars = new Set(wishItem.title.replace(/[（）()修订版全集]/g, ''));
  
  let titleOverlap = 0;
  wishTitleChars.forEach(char => {
    if (bookTitleChars.has(char)) {
      titleOverlap++;
    }
  });
  const titleScore = wishTitleChars.size > 0 ? titleOverlap / wishTitleChars.size : 0;
  
  const bookAuthorLastName = book.author.split('·')[0].charAt(0);
  const wishAuthorLastName = wishItem.author.split('·')[0].charAt(0);
  const authorScore = bookAuthorLastName === wishAuthorLastName ? 1 : 0;
  
  const score = titleScore * 0.6 + authorScore * 0.4;
  return Math.round(score * 100) / 100;
}

class BookStoreClass {
  private books: Book[] = [];
  private wishlist: WishlistItem[] = [];
  private borrowRecords: BorrowRecord[] = [];
  private salesRecords: SaleRecord[] = [];
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.initMockData();
  }

  private initMockData() {
    this.books = generateMockBooks(200);
    this.wishlist = generateMockWishlist();
    this.borrowRecords = generateMockBorrowRecords(this.books);
    this.salesRecords = generateMockSales(this.books);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getBooks(): Book[] {
    return [...this.books];
  }

  getBookById(id: string): Book | undefined {
    return this.books.find(b => b.id === id);
  }

  searchBooks(filters: SearchFilters): Book[] {
    return this.books.filter(book => {
      if (filters.category !== '全部' && book.category !== filters.category) {
        return false;
      }
      if (book.price < filters.minPrice || book.price > filters.maxPrice) {
        return false;
      }
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const titleMatch = book.title.toLowerCase().includes(kw);
        const authorMatch = book.author.toLowerCase().includes(kw);
        const isbnMatch = book.isbn.includes(kw);
        if (!titleMatch && !authorMatch && !isbnMatch) {
          return false;
        }
      }
      return true;
    });
  }

  addBook(bookData: Omit<Book, 'id'>): Book {
    const newBook: Book = {
      ...bookData,
      id: generateId(),
    };
    this.books.unshift(newBook);
    this.notify();
    return newBook;
  }

  updateBook(id: string, updates: Partial<Book>): Book | undefined {
    const index = this.books.findIndex(b => b.id === id);
    if (index === -1) return undefined;
    this.books[index] = { ...this.books[index], ...updates };
    this.notify();
    return this.books[index];
  }

  sellBook(id: string): Book | undefined {
    const book = this.books.find(b => b.id === id);
    if (!book || book.stock <= 0) return undefined;
    
    const newStock = book.stock - 1;
    const saleRecord: SaleRecord = {
      id: generateId(),
      bookId: id,
      saleDate: new Date().toISOString().split('T')[0],
      price: book.price,
    };
    this.salesRecords.push(saleRecord);
    
    const updatedBook = this.updateBook(id, {
      stock: newStock,
      lastSaleDate: new Date().toISOString().split('T')[0],
    });
    
    return updatedBook;
  }

  getWishlist(): WishlistItem[] {
    return [...this.wishlist];
  }

  addWishlistItem(item: Omit<WishlistItem, 'id' | 'status' | 'submitDate'>): WishlistItem {
    const newItem: WishlistItem = {
      ...item,
      id: generateId(),
      status: '待匹配',
      submitDate: new Date().toISOString().split('T')[0],
    };
    this.wishlist.unshift(newItem);
    this.notify();
    return newItem;
  }

  updateWishlistItem(id: string, updates: Partial<WishlistItem>): WishlistItem | undefined {
    const index = this.wishlist.findIndex(w => w.id === id);
    if (index === -1) return undefined;
    this.wishlist[index] = { ...this.wishlist[index], ...updates };
    this.notify();
    return this.wishlist[index];
  }

  matchBooksForWishlist(wishItemId: string): MatchResult[] {
    const wishItem = this.wishlist.find(w => w.id === wishItemId);
    if (!wishItem) return [];
    
    const results: MatchResult[] = [];
    this.books.forEach(book => {
      if (book.stock <= 0) return;
      if (book.price > wishItem.maxPrice) return;
      const score = calculateMatchScore(book, wishItem);
      if (score > 0.1) {
        results.push({ book, score });
      }
    });
    
    return results.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  borrowBook(bookId: string, borrowerName: string, dueDate: string): boolean {
    const book = this.books.find(b => b.id === bookId);
    if (!book || book.stock <= 0 || book.isBorrowed) return false;
    
    const borrowRecord: BorrowRecord = {
      id: generateId(),
      bookId,
      borrowerName,
      borrowDate: new Date().toISOString().split('T')[0],
      dueDate,
    };
    this.borrowRecords.push(borrowRecord);
    
    this.updateBook(bookId, {
      isBorrowed: true,
      borrowerName,
      dueDate,
      stock: book.stock - 1,
    });
    
    return true;
  }

  returnBook(bookId: string): boolean {
    const book = this.books.find(b => b.id === bookId);
    if (!book || !book.isBorrowed) return false;
    
    const record = this.borrowRecords.find(r => r.bookId === bookId && !r.returnDate);
    if (record) {
      record.returnDate = new Date().toISOString().split('T')[0];
    }
    
    this.updateBook(bookId, {
      isBorrowed: false,
      borrowerName: undefined,
      dueDate: undefined,
      stock: book.stock + 1,
    });
    
    return true;
  }

  getBorrowRecords(): BorrowRecord[] {
    return [...this.borrowRecords];
  }

  getOverdueBooks(): Book[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.books.filter(book => {
      if (!book.isBorrowed || !book.dueDate) return false;
      const dueDate = new Date(book.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return today > dueDate;
    });
  }

  getOverdueDays(book: Book): number {
    if (!book.dueDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(book.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  getMonthlySales(): { month: string; count: number }[] {
    const salesByMonth: Record<string, number> = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      salesByMonth[monthKey] = 0;
    }
    
    this.salesRecords.forEach(record => {
      const date = new Date(record.saleDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (salesByMonth.hasOwnProperty(monthKey)) {
        salesByMonth[monthKey]++;
      }
    });
    
    return Object.entries(salesByMonth).map(([month, count]) => ({
      month: month.substring(5) + '月',
      count,
    }));
  }

  getTopSellingBooks(limit: number = 5): { title: string; count: number }[] {
    const bookSales: Record<string, number> = {};
    
    this.salesRecords.forEach(record => {
      if (!bookSales[record.bookId]) {
        bookSales[record.bookId] = 0;
      }
      bookSales[record.bookId]++;
    });
    
    return Object.entries(bookSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([bookId, count]) => {
        const book = this.books.find(b => b.id === bookId);
        return {
          title: book ? book.title : '未知',
          count,
        };
      });
  }

  getUnsellableCount(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    return this.books.filter(book => {
      if (book.stock <= 0) return false;
      const entryDate = new Date(book.entryDate);
      entryDate.setHours(0, 0, 0, 0);
      
      if (book.lastSaleDate) {
        const lastSale = new Date(book.lastSaleDate);
        lastSale.setHours(0, 0, 0, 0);
        return lastSale < thirtyDaysAgo && entryDate < thirtyDaysAgo;
      }
      
      return entryDate < thirtyDaysAgo;
    }).length;
  }

  getSalesRecords(): SaleRecord[] {
    return [...this.salesRecords];
  }

  getPriceRange(): { min: number; max: number } {
    if (this.books.length === 0) return { min: 0, max: 100 };
    const prices = this.books.map(b => b.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }

  getCategories(): BookCategory[] {
    return ['文学', '科技', '生活'];
  }
}

export const BookStore = new BookStoreClass();
