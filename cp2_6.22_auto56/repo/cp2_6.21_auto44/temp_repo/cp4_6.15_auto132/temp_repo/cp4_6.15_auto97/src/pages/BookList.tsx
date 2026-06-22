import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import BookCard from '@/components/BookCard';
import type { Book } from '@/types';

const categories = ['all', '文学', '科技', '历史', '艺术', '经济', '心理'];
const stockStatuses = [
  { key: 'all', label: '全部' },
  { key: 'in_stock', label: '库存充足' },
  { key: 'low_stock', label: '库存紧张' },
  { key: 'out_of_stock', label: '缺货' },
];

export default function BookList() {
  const navigate = useNavigate();
  const {
    books,
    booksLoading,
    fetchBooks,
    searchQuery,
    setSearchQuery,
    searchSuggestions,
    searchBooks,
    filters,
    setFilters,
    setCircleReveal,
  } = useStore();

  const [localQuery, setLocalQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    setShowSuggestions(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
      searchBooks(value);
    }, 300);
  };

  const handleSuggestionClick = (title: string, book?: Book) => {
    setLocalQuery(title);
    setSearchQuery(title);
    setShowSuggestions(false);
    if (book) {
      navigate(`/book/${book.id}`);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    try {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? <span key={i} className="highlight">{part}</span> : part
      );
    } catch {
      return text;
    }
  };

  const handleCardClick = (e: React.MouseEvent, book: Book) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setCircleReveal({
      active: true,
      x: centerX,
      y: centerY,
      color: '#C67B3D',
    });

    setTimeout(() => {
      navigate(`/book/${book.id}`);
    }, 450);
  };

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      if (filters.category !== 'all' && book.category !== filters.category) {
        return false;
      }

      if (book.price < filters.priceRange[0] || book.price > filters.priceRange[1]) {
        return false;
      }

      if (filters.stockStatus === 'in_stock' && book.stock <= 10) {
        return false;
      }
      if (filters.stockStatus === 'low_stock' && (book.stock <= 0 || book.stock > 10)) {
        return false;
      }
      if (filters.stockStatus === 'out_of_stock' && book.stock > 0) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.isbn.includes(query)
        );
      }

      return true;
    });
  }, [books, filters, searchQuery]);

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">探索书香</h1>
        <p className="page-subtitle">发现您喜爱的好书</p>
      </div>

      <div className="search-container" ref={searchContainerRef}>
        <i className="fas fa-search search-icon"></i>
        <input
          type="text"
          className="search-input"
          placeholder="搜索书名、作者或ISBN..."
          value={localQuery}
          onChange={handleSearchChange}
          onFocus={() => localQuery && setShowSuggestions(true)}
        />
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="search-suggestions">
            {searchSuggestions.slice(0, 5).map(book => (
              <div
                key={book.id}
                className="search-suggestion"
                onClick={() => handleSuggestionClick(book.title, book)}
              >
                <div className="suggestion-title">
                  <i className="fas fa-book" style={{ marginRight: '8px', color: 'var(--color-primary)', fontSize: '12px' }}></i>
                  {highlightText(book.title, localQuery)}
                </div>
                <div className="suggestion-author">
                  <i className="fas fa-user" style={{ marginRight: '6px', fontSize: '10px' }}></i>
                  {highlightText(book.author, localQuery)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="filters-container">
        <div className="filter-section">
          <span className="filter-label">分类</span>
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-capsule ${filters.category === cat ? 'active' : ''}`}
              onClick={() => setFilters({ category: cat })}
            >
              {cat === 'all' ? '全部' : cat}
            </button>
          ))}
        </div>

        <div className="filter-section">
          <span className="filter-label">价格</span>
          <button
            className={`filter-capsule ${filters.priceRange[0] === 0 && filters.priceRange[1] === 500 ? 'active' : ''}`}
            onClick={() => setFilters({ priceRange: [0, 500] })}
          >
            全部
          </button>
          <button
            className={`filter-capsule ${filters.priceRange[0] === 0 && filters.priceRange[1] === 50 ? 'active' : ''}`}
            onClick={() => setFilters({ priceRange: [0, 50] })}
          >
            ¥50以下
          </button>
          <button
            className={`filter-capsule ${filters.priceRange[0] === 50 && filters.priceRange[1] === 100 ? 'active' : ''}`}
            onClick={() => setFilters({ priceRange: [50, 100] })}
          >
            ¥50-100
          </button>
          <button
            className={`filter-capsule ${filters.priceRange[0] === 100 && filters.priceRange[1] === 500 ? 'active' : ''}`}
            onClick={() => setFilters({ priceRange: [100, 500] })}
          >
            ¥100以上
          </button>
        </div>

        <div className="filter-section">
          <span className="filter-label">库存</span>
          {stockStatuses.map(status => (
            <button
              key={status.key}
              className={`filter-capsule ${filters.stockStatus === status.key ? 'active' : ''}`}
              onClick={() => setFilters({ stockStatus: status.key as typeof filters.stockStatus })}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {booksLoading ? (
        <div className="books-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card book-card" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="book-image-wrapper">
                <div className="skeleton" style={{ width: '100%', height: '100%' }}></div>
              </div>
              <div className="book-info">
                <div className="skeleton" style={{ height: '20px', width: '80%', marginBottom: '8px' }}></div>
                <div className="skeleton" style={{ height: '16px', width: '60%', marginBottom: '8px' }}></div>
                <div className="skeleton" style={{ height: '20px', width: '40%' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-light)' }}>
          <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
          <p>没有找到匹配的图书</p>
        </div>
      ) : (
        <div className="books-grid">
          {filteredBooks.map((book, index) => (
            <BookCard
              key={book.id}
              book={book}
              index={index}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
