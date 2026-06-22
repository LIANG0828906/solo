import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BookCard from './BookCard';
import ReserveModal from '../LendingModule/ReserveModal';
import type { Book } from '../types';
import { fetchBooks, searchBooks } from '../utils/api';
import { debounce } from '../utils/helpers';

interface BookListProps {
  searchQuery: string;
  selectedCategory: string;
  categories: string[];
  onSearchDebounced: (query: string) => void;
}

export default function BookList({
  searchQuery,
  selectedCategory,
  categories,
  onSearchDebounced,
}: BookListProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchBooks({ limit: 100 });
      if (response.success) {
        setBooks(response.data);
        setFilteredBooks(response.data);
      }
    } catch (err: any) {
      setError(err.message || '加载图书失败');
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = useCallback(
    debounce(async (query: string, category: string) => {
      if (!query.trim() && category === 'all') {
        setFilteredBooks(books);
        return;
      }
      try {
        setIsLoading(true);
        const response = await searchBooks({
          q: query,
          category: category === 'all' ? undefined : category,
        });
        if (response.success) {
          setFilteredBooks(response.data);
        }
      } catch (err: any) {
        console.error('搜索失败:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [books]
  );

  useEffect(() => {
    performSearch(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory, performSearch]);

  const handleCardClick = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedBook(null), 300);
  };

  const emptyState = useMemo(() => {
    return (
      <div
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          color: '#64748B',
        }}
      >
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#475569"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <circle cx="12" cy="12" r="9" fill="none" stroke="#475569" strokeWidth="0.5" />
          </svg>
        </div>
        <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          未找到相关图书
        </p>
        <p style={{ fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>
          试试其他关键词，或选择不同的分类进行筛选
        </p>
      </div>
    );
  }, []);

  const loadingState = useMemo(() => {
    return (
      <>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '280px',
              backgroundColor: '#1E293B',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '160px',
                height: '240px',
                alignSelf: 'center',
                backgroundColor: '#334155',
                borderRadius: '8px',
                animation: 'pulse 2s infinite',
              }}
            />
            <div
              style={{
                height: '24px',
                backgroundColor: '#334155',
                borderRadius: '4px',
                animation: 'pulse 2s infinite',
              }}
            />
            <div
              style={{
                height: '18px',
                width: '60%',
                backgroundColor: '#334155',
                borderRadius: '4px',
                animation: 'pulse 2s infinite',
              }}
            />
          </div>
        ))}
      </>
    );
  }, []);

  return (
    <div style={{ width: '100%' }}>
      {!isLoading && filteredBooks.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '14px', color: '#94A3B8' }}>
            共找到 <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{filteredBooks.length}</span> 本图书
            {selectedCategory !== 'all' && (
              <span>
                {' · '}
                分类：
                <span style={{ color: '#6366F1', fontWeight: 500 }}>{selectedCategory}</span>
              </span>
            )}
            {searchQuery && (
              <span>
                {' · '}
                关键词：
                <span style={{ color: '#6366F1', fontWeight: 500 }}>
                  "{searchQuery}"
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 280px)',
          gap: '24px',
          justifyContent: 'center',
        }}
      >
        {isLoading ? (
          loadingState
        ) : error ? (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '60px 24px',
              color: '#EF4444',
            }}
          >
            <p style={{ fontSize: '16px', marginBottom: '16px' }}>{error}</p>
            <button
              onClick={loadBooks}
              style={{
                padding: '10px 24px',
                backgroundColor: '#6366F1',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              重新加载
            </button>
          </div>
        ) : filteredBooks.length === 0 ? (
          emptyState
        ) : (
          filteredBooks.map((book, index) => (
            <BookCard
              key={book.id}
              book={book}
              index={index}
              onClick={() => handleCardClick(book)}
            />
          ))
        )}
      </div>

      <ReserveModal
        book={selectedBook}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
