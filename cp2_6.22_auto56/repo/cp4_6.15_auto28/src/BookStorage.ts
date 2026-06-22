import type { Book, ReadingRecord, ValidationResult, CategoryStats, MonthlyReadingStats, DailyPageStats } from './types';

const BOOKS_KEY = 'library_books';
const RECORDS_KEY = 'library_records';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getISBNValidationError(isbn: string): string | null {
  if (!isbn) return null;
  
  const cleaned = isbn.replace(/[- ]/g, '').toUpperCase();
  
  if (cleaned.length !== 10 && cleaned.length !== 13) {
    return 'ISBN 长度不正确，应为 10 或 13 位';
  }
  
  if (cleaned.length === 10) {
    if (!/^[0-9]{9}[0-9X]$/.test(cleaned)) {
      return 'ISBN-10 格式错误，前9位应为数字，最后一位为数字或X';
    }
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * (10 - i);
    }
    const checkChar = cleaned[9];
    const checkValue = checkChar === 'X' ? 10 : parseInt(checkChar);
    sum += checkValue;
    if (sum % 11 !== 0) {
      return 'ISBN-10 校验位不正确';
    }
  }
  
  if (cleaned.length === 13) {
    if (!/^[0-9]{13}$/.test(cleaned)) {
      return 'ISBN-13 格式错误，应为13位数字';
    }
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      const digit = parseInt(cleaned[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    if (sum % 10 !== 0) {
      return 'ISBN-13 校验位不正确';
    }
  }
  
  return null;
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
  if (data.isbn) {
    const isbnError = getISBNValidationError(data.isbn);
    if (isbnError) {
      errors.isbn = isbnError;
    }
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

  previewImportData(json: string): { totalBooks: number; duplicates: string[]; duplicateBooks: Book[]; errors: string[] } {
    const result = { totalBooks: 0, duplicates: [] as string[], duplicateBooks: [] as Book[], errors: [] as string[] };

    try {
      const data = JSON.parse(json);
      const existingBooks = this.getBooks();

      if (!Array.isArray(data.books)) {
        result.errors.push('数据格式错误：缺少 books 数组');
        return result;
      }

      result.totalBooks = data.books.length;
      const existingIsbns = new Set(existingBooks.map(b => b.isbn).filter(Boolean));

      for (const bookData of data.books) {
        const validation = validateBook(bookData);
        if (!validation.isValid) {
          result.errors.push(`图书 "${bookData.title || '未知'}" 验证失败: ${Object.values(validation.errors).join(', ')}`);
          continue;
        }

        if (bookData.isbn && existingIsbns.has(bookData.isbn)) {
          result.duplicates.push(bookData.isbn);
          result.duplicateBooks.push(bookData);
        }
      }
    } catch (e) {
      result.errors.push(`JSON解析失败: ${e instanceof Error ? e.message : '未知错误'}`);
    }

    return result;
  },

  async importDataWithConfirmation(json: string): Promise<{ imported: number; duplicates: string[]; errors: string[]; cancelled: boolean }> {
    const result = { imported: 0, duplicates: [] as string[], errors: [] as string[], cancelled: false };
    
    try {
      const data = JSON.parse(json);
      const existingBooks = this.getBooks();
      const existingRecords = this.getAllReadingRecords();
      
      if (!Array.isArray(data.books)) {
        result.errors.push('数据格式错误：缺少 books 数组');
        return result;
      }
      
      const existingIsbns = new Set(existingBooks.map(b => b.isbn).filter(Boolean));
      const duplicateBooks: Book[] = [];
      const validBooks: Book[] = [];
      
      for (const bookData of data.books) {
        const validation = validateBook(bookData);
        if (!validation.isValid) {
          result.errors.push(`图书 "${bookData.title || '未知'}" 验证失败: ${Object.values(validation.errors).join(', ')}`);
          continue;
        }
        
        if (bookData.isbn && existingIsbns.has(bookData.isbn)) {
          result.duplicates.push(bookData.isbn);
          duplicateBooks.push(bookData);
        } else {
          validBooks.push(bookData);
        }
      }

      let skipDuplicates = true;
      if (duplicateBooks.length > 0) {
        const confirmed = await this.showDuplicateConfirmation(data.books.length, duplicateBooks, result.errors.length);
        if (confirmed === 'cancel') {
          result.cancelled = true;
          return result;
        }
        skipDuplicates = confirmed === 'skip';
      }
      
      const now = new Date().toISOString();
      const newBooks: Book[] = [];
      const usedIsbns = new Set(existingIsbns);

      const booksToProcess = skipDuplicates ? validBooks : [...validBooks, ...duplicateBooks];
      
      for (const bookData of booksToProcess) {
        newBooks.push({
          ...bookData,
          id: generateId(),
          createdAt: bookData.createdAt || now,
          updatedAt: bookData.updatedAt || now
        });
        
        if (bookData.isbn) {
          usedIsbns.add(bookData.isbn);
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

  showDuplicateConfirmation(totalBooks: number, duplicateBooks: Book[], errorCount: number): Promise<'skip' | 'import-all' | 'cancel'> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 200ms;
      `;

      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.cssText = `
        background: var(--color-white, #fff);
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
        transform-origin: center center;
        animation: scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
      `;

      const displayBooks = duplicateBooks.slice(0, 5);
      const remaining = duplicateBooks.length - displayBooks.length;

      modal.innerHTML = `
        <div style="padding: 24px; border-bottom: 1px solid var(--color-border, #e5e7eb); display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-family: var(--font-display, serif); font-size: 20px; color: var(--color-text, #333); margin: 0;">
            ⚠️ 检测到重复 ISBN
          </h3>
          <button class="modal-close-btn" style="width: 32px; height: 32px; border: none; background: transparent; border-radius: 50%; cursor: pointer; font-size: 18px; color: var(--color-text-light, #666);">✕</button>
        </div>
        <div style="padding: 24px;">
          <p style="margin-bottom: 16px; color: var(--color-text, #333);">
            文件中共包含 <strong>${totalBooks}</strong> 本图书，其中
            <strong style="color: var(--color-error, #ef4444);"> ${duplicateBooks.length} </strong>
            本的 ISBN 已存在于您的书库中：
          </p>
          <div style="background: var(--color-bg-alt, #f5f0e8); border-radius: 8px; padding: 12px; max-height: 200px; overflow-y: auto; margin-bottom: 16px;">
            ${displayBooks.map(book => `
              <div style="padding: 8px 0; border-bottom: 1px solid var(--color-border, #e5e7eb); font-size: 14px;">
                <div style="font-weight: 600; color: var(--color-text, #333);">${book.title}</div>
                <div style="color: var(--color-text-light, #666); font-size: 12px;">${book.author} · ISBN: ${book.isbn}</div>
              </div>
            `).join('')}
            ${remaining > 0 ? `
              <div style="color: var(--color-text-light, #666); font-size: 12px; margin-top: 8px;">
                ...还有 ${remaining} 本重复图书
              </div>
            ` : ''}
          </div>
          ${errorCount > 0 ? `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 13px; color: #991b1b;">
              ⚠️ 另外有 ${errorCount} 条数据验证失败将被跳过
            </div>
          ` : ''}
          <p style="font-size: 14px; color: var(--color-text-light, #666); margin-bottom: 0;">
            请选择如何处理这些重复数据：
          </p>
        </div>
        <div style="padding: 16px 24px; border-top: 1px solid var(--color-border, #e5e7eb); display: flex; flex-direction: column; gap: 10px;">
          <button class="btn-skip" style="padding: 12px 20px; border: none; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; background: var(--color-primary, #8b7355); color: var(--color-white, #fff); transition: all 200ms;">
            📥 跳过重复，导入其余 ${totalBooks - duplicateBooks.length} 本
          </button>
          <button class="btn-import-all" style="padding: 12px 20px; border: 1px solid var(--color-border, #e5e7eb); border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; background: var(--color-white, #fff); color: var(--color-text, #333); transition: all 200ms;">
            ⚡ 强制全部导入（保留重复）
          </button>
          <button class="btn-cancel" style="padding: 12px 20px; border: 1px solid var(--color-border, #e5e7eb); border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; background: var(--color-white, #fff); color: var(--color-text, #333); transition: all 200ms;">
            取消导入
          </button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const closeWithAnimation = (action: 'skip' | 'import-all' | 'cancel') => {
        modal.style.animation = 'scaleOut 300ms forwards';
        overlay.style.animation = 'fadeIn 200ms reverse forwards';
        setTimeout(() => {
          document.body.removeChild(overlay);
          resolve(action);
        }, 280);
      };

      modal.querySelector('.modal-close-btn')?.addEventListener('click', () => closeWithAnimation('cancel'));
      modal.querySelector('.btn-skip')?.addEventListener('click', () => closeWithAnimation('skip'));
      modal.querySelector('.btn-import-all')?.addEventListener('click', () => closeWithAnimation('import-all'));
      modal.querySelector('.btn-cancel')?.addEventListener('click', () => closeWithAnimation('cancel'));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeWithAnimation('cancel');
      });
    });
  },

  importData(json: string, skipDuplicates: boolean = true): { imported: number; duplicates: string[]; errors: string[] } {
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
          if (skipDuplicates) {
            continue;
          }
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
