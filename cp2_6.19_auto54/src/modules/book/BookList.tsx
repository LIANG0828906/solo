import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Filter } from 'lucide-react';
import { BookCard } from './BookCard';
import { useBookStore } from './BookManager';
import type { BookCategory, BookExchangeMode, Book } from '../../shared/types';

const CATEGORIES: BookCategory[] = ['小说', '非小说', '技术', '艺术'];
const EXCHANGE_MODES: Array<{ value: BookExchangeMode | 'all'; label: string }> = [
  { value: 'all', label: '全部方式' },
  { value: 'exchange_only', label: '仅交换' },
  { value: 'borrow_only', label: '仅借阅' },
  { value: 'both', label: '两者均可' },
];

export function BookList() {
  const books = useBookStore((state) => state.books);
  const newBookId = useBookStore((state) => state.newBookId);
  const isNewBookAnimating = useBookStore((state) => state.isNewBookAnimating);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<BookCategory | 'all'>('all');
  const [exchangeMode, setExchangeMode] = useState<BookExchangeMode | 'all'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsSearching(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setIsSearching(false);
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [searchQuery]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch = book.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        book.author.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = category === 'all' || book.category === category;
      const matchesMode = exchangeMode === 'all' || book.exchangeMode === exchangeMode;
      return matchesSearch && matchesCategory && matchesMode;
    });
  }, [books, debouncedSearch, category, exchangeMode]);

  return (
    <div className="page-container">
      <h1 className="page-title">图书浏览</h1>

      <div className="filter-section">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: 40 }}
            placeholder="搜索书名或作者..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Filter size={18} style={{ color: '#8B4513' }} />
          <select
            className="filter-select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as BookCategory | 'all');
            }}
          >
            <option value="all">全部类别</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={exchangeMode}
            onChange={(e) => {
              setExchangeMode(e.target.value as BookExchangeMode | 'all');
            }}
          >
            {EXCHANGE_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>{mode.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p>没有找到符合条件的图书</p>
        </div>
      ) : (
        <div className="book-grid">
          {filteredBooks.map((book: Book, index: number) => (
            <BookCard
              key={book.id}
              book={book}
              isNew={book.id === newBookId}
              isAnimating={isNewBookAnimating}
              animationDelay={isSearching ? index * 50 : 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
