import { useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import BookCard from './BookCard';
import { useAppStore } from '../store';
import { bookApi } from '../services/api';

const DEBOUNCE_DELAY = 300;

const BookShelf = () => {
  const { books, totalBooks, allTags, setBooks, setAllTags, isLoading, setLoading, addToast } =
    useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSearch = searchParams.get('search') || '';
  const currentTag = searchParams.get('tag') || '';

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await bookApi.getTags();
        setAllTags(tags);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };
    fetchTags();
  }, [setAllTags]);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const result = await bookApi.getBooks({
          search: currentSearch || undefined,
          tag: currentTag || undefined,
        });
        setBooks(result.books, result.total);
      } catch (error) {
        console.error('Failed to fetch books:', error);
        addToast('加载书籍数据失败', 'warning');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [currentSearch, currentTag, setBooks, setLoading, addToast]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (value) {
            next.set('search', value);
          } else {
            next.delete('search');
          }
          return next;
        });
      }, DEBOUNCE_DELAY);
    },
    [setSearchParams]
  );

  const handleTagChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set('tag', value);
        } else {
          next.delete('tag');
        }
        return next;
      });
    },
    [setSearchParams]
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
            defaultValue={currentSearch}
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
          value={currentTag}
          onChange={handleTagChange}
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
          共 {totalBooks} 本书
        </span>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>加载中...</div>
      ) : books.length === 0 ? (
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
          {books.map((book) => (
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
