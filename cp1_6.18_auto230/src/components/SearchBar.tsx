import React, { useState, useRef, useEffect } from 'react';
import type { SearchResult } from '../api';

const COLORS = {
  primaryBg: '#1A1A2E',
  secondaryBg: '#16213E',
  text: '#EAEAEA',
  accent: '#D4A574',
  border: '#3A3A3A',
};

interface SearchBarProps {
  onSearch: (query: string) => void;
  results: SearchResult[];
  onAddBook: (book: SearchResult) => void;
  existingBookIds: string[];
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  results,
  onAddBook,
  existingBookIds,
}) => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim()) {
      debounceRef.current = setTimeout(() => {
        onSearch(value.trim());
        setIsAnimating(true);
        setShowResults(true);
        setTimeout(() => setIsAnimating(false), 300);
      }, 300);
    } else {
      setShowResults(false);
    }
  };

  const handleAdd = (book: SearchResult) => {
    onAddBook(book);
    setQuery('');
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <style>{`
        @keyframes fadeInSlideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .search-results {
          animation: fadeInSlideDown 0.3s ease-out;
        }
      `}</style>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.trim() && results.length > 0 && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        placeholder="搜索书籍..."
        style={{
          width: '100%',
          padding: '10px 14px',
          backgroundColor: COLORS.secondaryBg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '8px',
          color: COLORS.text,
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s ease',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = COLORS.accent;
          if (query.trim() && results.length > 0) {
            setShowResults(true);
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 300);
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = COLORS.border;
        }}
      />

      {showResults && results.length > 0 && (
        <div
          className="search-results"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: COLORS.secondaryBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            maxHeight: '320px',
            overflowY: 'auto',
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            opacity: isAnimating ? undefined : 1,
            transform: isAnimating ? undefined : 'translateY(0)',
          }}
        >
          {results.map((book) => {
            const isAdded = existingBookIds.includes(book.id);
            return (
              <div
                key={book.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderBottom: `1px solid ${COLORS.border}`,
                  cursor: isAdded ? 'default' : 'pointer',
                  opacity: isAdded ? 0.5 : 1,
                  transition: 'background-color 0.15s ease',
                  backgroundColor: 'transparent',
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!isAdded) handleAdd(book);
                }}
                onMouseEnter={(e) => {
                  if (!isAdded) {
                    e.currentTarget.style.backgroundColor = 'rgba(212, 165, 116, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={book.cover}
                    alt={book.title}
                    style={{
                      width: '36px',
                      height: '52px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div
                      style={{
                        color: COLORS.text,
                        fontSize: '13px',
                        fontWeight: 500,
                        lineHeight: 1.3,
                      }}
                    >
                      {book.title}
                    </div>
                    <div
                      style={{
                        color: COLORS.accent,
                        fontSize: '11px',
                        opacity: 0.9,
                      }}
                    >
                      {book.author}
                    </div>
                  </div>
                </div>
                {isAdded ? (
                  <span
                    style={{
                      color: COLORS.accent,
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(212, 165, 116, 0.15)',
                    }}
                  >
                    已添加
                  </span>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={COLORS.accent}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ opacity: 0.7 }}
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
