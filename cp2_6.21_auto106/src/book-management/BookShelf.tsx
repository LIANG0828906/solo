import { useMemo, useRef, useCallback } from 'react';
import BookCard from './BookCard';
import { useAppStore } from '../store';

const DEBOUNCE_DELAY = 300;

const BookShelf = () => {
  const { books, filteredBooks, searchQuery, selectedTag, setSearchQuery, setSelectedTag, isLoading } =
    useAppStore();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    books.forEach((book) => book.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet);
  }, [books]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        setSearchQuery(value);
      }, DEBOUNCE_DELAY);
    },
    [setSearchQuery]
  );

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#333' }}>
        我的书架
      </h2>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="搜索书名或作者..."
            defaultValue={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '10px 20px 10px 40px',
              borderRadius: '20px',
              border: '2px solid transparent',
              background: '#f0ede8',
              fontSize: '14px',
              transition: 'all 0.3s ease-out',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#8e44ad';
              e.target.style.background = '#fff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'transparent';
              e.target.style.background = '#f0ede8';
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '16px',
              color: '#999',
            }}
          >
            🔍
          </span>
        </div>

        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '20px',
            border: 'none',
            background: '#f0ede8',
            fontSize: '14px',
            color: '#333',
            cursor: 'pointer',
            transition: 'all 0.3s ease-out',
          }}
        >
          <option value="">全部分类</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>

        <span style={{ fontSize: '13px', color: '#888' }}>
          共 {filteredBooks.length} 本书
        </span>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>加载中...</div>
      ) : filteredBooks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
          暂无匹配的书籍
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
          }}
        >
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BookShelf;
