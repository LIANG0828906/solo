import React, { useEffect, useState } from 'react';
import { useReadingListStore, type Book } from './store';
import { searchBooks, generateSummary, type SearchResult } from './api';

const COLORS = {
  primaryBg: '#1A1A2E',
  secondaryBg: '#16213E',
  text: '#EAEAEA',
  accent: '#D4A574',
  border: '#3A3A3A',
};

const BookLogo: React.FC = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    style={{ filter: `drop-shadow(0 0 4px ${COLORS.accent})` }}
  >
    <path
      d="M6 4C6 4 10 4 16 4C22 4 26 4 26 4V28C26 28 22 28 16 28C10 28 6 28 6 28V4Z"
      stroke={COLORS.accent}
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M16 4V28"
      stroke={COLORS.accent}
      strokeWidth="2"
    />
    <path
      d="M9 9H14"
      stroke={COLORS.accent}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M9 13H14"
      stroke={COLORS.accent}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M18 9H23"
      stroke={COLORS.accent}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M18 13H23"
      stroke={COLORS.accent}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim()) {
      onSearch(value.trim());
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const handleAdd = (book: SearchResult) => {
    onAddBook(book);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.trim() && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        placeholder="搜索书籍..."
        style={{
          width: '100%',
          padding: '8px 12px',
          backgroundColor: COLORS.secondaryBg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '4px',
          color: COLORS.text,
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {showResults && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: COLORS.secondaryBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '4px',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 100,
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
                  padding: '8px 12px',
                  borderBottom: `1px solid ${COLORS.border}`,
                  cursor: isAdded ? 'default' : 'pointer',
                  opacity: isAdded ? 0.5 : 1,
                }}
                onMouseDown={() => !isAdded && handleAdd(book)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={book.cover}
                    alt={book.title}
                    style={{
                      width: '32px',
                      height: '48px',
                      objectFit: 'cover',
                    }}
                  />
                  <div>
                    <div style={{ color: COLORS.text, fontSize: '13px', fontWeight: 500 }}>
                      {book.title}
                    </div>
                    <div style={{ color: COLORS.accent, fontSize: '11px' }}>
                      {book.author}
                    </div>
                  </div>
                </div>
                {isAdded && (
                  <span style={{ color: COLORS.accent, fontSize: '11px' }}>已添加</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface BookCardProps {
  book: Book;
  onRemove: (bookId: string) => void;
  onGenerateSummary: (book: Book) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onRemove, onGenerateSummary }) => {
  return (
    <div
      style={{
        backgroundColor: COLORS.secondaryBg,
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '150%',
          overflow: 'hidden',
        }}
      >
        <img
          src={book.cover}
          alt={book.title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <button
          onClick={() => onRemove(book.id)}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'rgba(26, 26, 46, 0.8)',
            border: `1px solid ${COLORS.border}`,
            color: COLORS.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
          }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3
          style={{
            margin: 0,
            color: COLORS.text,
            fontSize: '14px',
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          {book.title}
        </h3>
        <p
          style={{
            margin: 0,
            color: COLORS.accent,
            fontSize: '12px',
          }}
        >
          {book.author}
        </p>
        {book.summary ? (
          <p
            style={{
              margin: 0,
              color: COLORS.text,
              fontSize: '12px',
              opacity: 0.7,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {book.summary}
          </p>
        ) : (
          <button
            onClick={() => onGenerateSummary(book)}
            disabled={book.isGenerating}
            style={{
              marginTop: 'auto',
              padding: '6px 12px',
              backgroundColor: book.isGenerating ? COLORS.border : COLORS.accent,
              border: 'none',
              borderRadius: '4px',
              color: book.isGenerating ? COLORS.text : COLORS.primaryBg,
              fontSize: '12px',
              fontWeight: 500,
              cursor: book.isGenerating ? 'not-allowed' : 'pointer',
            }}
          >
            {book.isGenerating ? '生成中...' : '生成摘要'}
          </button>
        )}
        {book.highlights.length > 0 && (
          <div
            style={{
              marginTop: '4px',
              paddingTop: '8px',
              borderTop: `1px solid ${COLORS.border}`,
              color: COLORS.accent,
              fontSize: '11px',
            }}
          >
            {book.highlights.length} 条划线
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const {
    readingList,
    searchResults,
    addBook,
    removeBook,
    setSummary,
    setSearchResults,
    setIsGenerating,
    loadFromStorage,
  } = useReadingListStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleSearch = async (query: string) => {
    try {
      const results = await searchBooks(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  const handleAddBook = (book: SearchResult) => {
    addBook({
      id: book.id,
      title: book.title,
      author: book.author,
      cover: book.cover,
    });
  };

  const handleGenerateSummary = async (book: Book) => {
    setIsGenerating(book.id, true);
    try {
      const response = await generateSummary({
        bookId: book.id,
        title: book.title,
        author: book.author,
      });
      setSummary(book.id, response.summary);
    } catch (error) {
      console.error('Generate summary failed:', error);
    } finally {
      setIsGenerating(book.id, false);
    }
  };

  const existingBookIds = readingList.map((book) => book.id);

  const sidebarStyles: React.CSSProperties = {
    backgroundColor: COLORS.primaryBg,
    borderRight: `1px solid ${COLORS.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const contentStyles: React.CSSProperties = {
    backgroundColor: COLORS.primaryBg,
    flex: 1,
    overflow: 'auto',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: COLORS.primaryBg,
        color: COLORS.text,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <style>
        {`
          @media (min-width: 768px) {
            .app-container {
              flex-direction: row !important;
            }
            .sidebar {
              width: 240px !important;
              padding: 24px 20px !important;
              min-height: 100vh !important;
              position: sticky !important;
              top: 0 !important;
            }
            .content {
              padding: 32px !important;
            }
            .book-grid {
              grid-template-columns: repeat(4, 1fr) !important;
            }
          }
          @media (max-width: 767px) {
            .sidebar {
              padding: 16px !important;
              border-right: none !important;
              border-bottom: 1px solid ${COLORS.border} !important;
            }
            .content {
              padding: 16px !important;
            }
            .book-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            .sidebar-title {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <aside className="sidebar" style={sidebarStyles}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <BookLogo />
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: COLORS.accent,
              }}
            >
              ReadHub
            </span>
          </div>

          <SearchBar
            onSearch={handleSearch}
            results={searchResults}
            onAddBook={handleAddBook}
            existingBookIds={existingBookIds}
          />

          <h2
            className="sidebar-title"
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
              color: COLORS.text,
              opacity: 0.8,
            }}
          >
            我的阅读列表
          </h2>
        </aside>

        <main className="content" style={contentStyles}>
          {readingList.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: '400px',
                gap: '12px',
              }}
            >
              <BookLogo />
              <p style={{ color: COLORS.text, opacity: 0.6, fontSize: '14px', margin: 0 }}>
                搜索并添加书籍开始阅读
              </p>
            </div>
          ) : (
            <div
              className="book-grid"
              style={{
                display: 'grid',
                gap: '20px',
              }}
            >
              {readingList.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onRemove={removeBook}
                  onGenerateSummary={handleGenerateSummary}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
