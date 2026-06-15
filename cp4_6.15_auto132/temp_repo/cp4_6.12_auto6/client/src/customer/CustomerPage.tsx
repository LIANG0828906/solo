import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book, Category, SearchResult } from '../types';
import { CATEGORIES } from '../types';
import StarRating from '../components/StarRating';
import useInfiniteScroll from '../hooks/useInfiniteScroll';

const PAGE_SIZE = 20;

interface BookCardProps {
  book: Book;
  onClick: () => void;
}

function BookCard({ book, onClick }: BookCardProps) {
  return (
    <div
      className="card-hover"
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          height: '300px',
          background: book.coverGradient,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '16px',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: '20px',
            fontWeight: 600,
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {book.title}
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '13px',
            marginTop: '4px',
          }}
        >
          {book.author}
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#FF7043', fontSize: '22px', fontWeight: 700 }}>
            ¥{book.price.toFixed(2)}
          </div>
          <StarRating rating={book.condition} size={16} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <div
            style={{
              background: '#F5E6D3',
              color: '#6D4C41',
              fontSize: '12px',
              padding: '3px 10px',
              borderRadius: '10px',
            }}
          >
            {book.category}
          </div>
          <div style={{ color: '#A1887F', fontSize: '12px' }}>
            流通 {book.circulationCount} 次
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          height: '300px',
          background: 'linear-gradient(90deg, #E0E0E0 25%, #F0F0F0 50%, #E0E0E0 75%)',
          backgroundSize: '200% 100%',
          animation: 'skeletonPulse 1.5s ease-in-out infinite',
        }}
      />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              width: '60px',
              height: '22px',
              background: 'linear-gradient(90deg, #E0E0E0 25%, #F0F0F0 50%, #E0E0E0 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeletonPulse 1.5s ease-in-out infinite',
              borderRadius: '4px',
            }}
          />
          <div
            style={{
              width: '80px',
              height: '16px',
              background: 'linear-gradient(90deg, #E0E0E0 25%, #F0F0F0 50%, #E0E0E0 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeletonPulse 1.5s ease-in-out infinite',
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <div
            style={{
              width: '40px',
              height: '18px',
              background: 'linear-gradient(90deg, #E0E0E0 25%, #F0F0F0 50%, #E0E0E0 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeletonPulse 1.5s ease-in-out infinite',
              borderRadius: '10px',
            }}
          />
          <div
            style={{
              width: '60px',
              height: '12px',
              background: 'linear-gradient(90deg, #E0E0E0 25%, #F0F0F0 50%, #E0E0E0 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeletonPulse 1.5s ease-in-out infinite',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function CustomerPage() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [sort, setSort] = useState<'sales' | 'createdAt'>('createdAt');
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('keyword', searchQuery);
      if (activeCategory) params.append('category', activeCategory);
      params.append('sort', sort);
      params.append('page', String(1));
      params.append('pageSize', String(PAGE_SIZE));

      const res = await fetch(`/api/books?${params.toString()}`);
      const result: SearchResult = await res.json();
      setBooks(result.data);
      setPage(1);
      setHasMore((1 * PAGE_SIZE) < result.total);
    } catch (e) {
      console.error('Failed to fetch books:', e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory, sort]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams();
      if (searchQuery) params.append('keyword', searchQuery);
      if (activeCategory) params.append('category', activeCategory);
      params.append('sort', sort);
      params.append('page', String(nextPage));
      params.append('pageSize', String(PAGE_SIZE));

      const res = await fetch(`/api/books?${params.toString()}`);
      const result: SearchResult = await res.json();
      setBooks((prev) => [...prev, ...result.data]);
      setPage(nextPage);
      setHasMore((nextPage * PAGE_SIZE) < result.total);
    } catch (e) {
      console.error('Failed to load more books:', e);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, searchQuery, activeCategory, sort]);

  const sentinelRef = useInfiniteScroll(loadMore, { hasMore, isLoading: loading });

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(keyword.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchQuery(keyword.trim());
    }
  };

  const handleCategoryClick = (category: Category | null) => {
    setActiveCategory(category);
    setPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as 'sales' | 'createdAt');
    setPage(1);
  };

  const renderCategoryTabs = () => (
    <div style={{ display: 'flex', borderBottom: '1px solid #D7CCC8', background: 'white' }}>
      <button
        onClick={() => handleCategoryClick(null)}
        style={{
          padding: '12px 20px',
          fontSize: '15px',
          transition: '0.2s',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: activeCategory === null ? '#3E2723' : '#8D6E63',
          fontWeight: activeCategory === null ? 600 : 400,
          borderBottom: activeCategory === null ? '3px solid #FF7043' : '3px solid transparent',
          marginBottom: '-1px',
          fontFamily: 'inherit',
        }}
      >
        全部
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => handleCategoryClick(cat)}
          style={{
            padding: '12px 20px',
            fontSize: '15px',
            transition: '0.2s',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: activeCategory === cat ? '#3E2723' : '#8D6E63',
            fontWeight: activeCategory === cat ? 600 : 400,
            borderBottom: activeCategory === cat ? '3px solid #FF7043' : '3px solid transparent',
            marginBottom: '-1px',
            fontFamily: 'inherit',
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FAF0E6' }}>
      <style>{`
        @keyframes skeletonPulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 767px) {
          .desktop-search { display: none !important; }
          .mobile-search { display: block !important; }
          .desktop-admin-link { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
        @media (min-width: 768px) {
          .mobile-search { display: none !important; }
          .hamburger-btn { display: none !important; }
        }
      `}</style>

      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          background: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-serif, "Noto Serif SC", serif)',
            fontSize: '22px',
            color: '#8D6E63',
            fontWeight: 'bold',
            paddingLeft: '24px',
            flexShrink: 0,
          }}
        >
          旧书循环
        </div>

        <div className="desktop-search" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '520px' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#A1887F',
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索书名、作者..."
              style={{
                width: '100%',
                borderRadius: '32px',
                border: '1px solid #D7CCC8',
                padding: '8px 16px 8px 40px',
                background: '#FAFAFA',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        <div
          className="desktop-admin-link"
          style={{
            paddingRight: '24px',
            flexShrink: 0,
          }}
        >
          <a
            href="/admin"
            style={{
              color: '#8D6E63',
              padding: '8px 16px',
              borderRadius: '6px',
              textDecoration: 'none',
              transition: 'background 0.2s',
              display: 'inline-block',
              fontSize: '14px',
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#F5E6D3'; }}
            onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
          >
            管理后台
          </a>
        </div>

        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(true)}
          style={{
            display: 'none',
            marginRight: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            flexDirection: 'column',
            gap: '5px',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="3" y1="6" x2="21" y2="6" stroke="#8D6E63" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="12" x2="21" y2="12" stroke="#8D6E63" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="18" x2="21" y2="18" stroke="#8D6E63" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </nav>

      {mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 99,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '70%',
              background: 'white',
              zIndex: 100,
              transform: 'translateX(0)',
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '-4px 0 12px rgba(0,0,0,0.15)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  fontSize: '24px',
                  color: '#8D6E63',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: '12px 16px',
                  color: '#3E2723',
                  fontSize: '16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                }}
                onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#F5E6D3'; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
              >
                首页
              </a>
              <a
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: '12px 16px',
                  color: '#3E2723',
                  fontSize: '16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                }}
                onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#F5E6D3'; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
              >
                管理后台
              </a>
            </div>
          </div>
        </>
      )}

      <div style={{ paddingTop: '64px' }}>
        <div className="mobile-search" style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #D7CCC8' }}>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#A1887F',
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索书名、作者..."
              style={{
                width: '100%',
                borderRadius: '32px',
                border: '1px solid #D7CCC8',
                padding: '8px 16px 8px 40px',
                background: '#FAFAFA',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'block' }}>
          {renderCategoryTabs()}
        </div>

        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <select
              value={sort}
              onChange={handleSortChange}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #D7CCC8',
                background: 'white',
                fontSize: '14px',
                color: '#3E2723',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            >
              <option value="createdAt">按上架时间</option>
              <option value="sales">按销量</option>
            </select>
          </div>

          {loading && books.length === 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: '#A1887F',
                fontSize: '16px',
              }}
            >
              暂无书籍，试试其他关键词或分类
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '16px',
                }}
              >
                {books.map((book) => (
                  <BookCard key={book.id} book={book} onClick={() => navigate(`/book/${book.id}`)} />
                ))}
              </div>

              {loading && books.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '16px',
                    marginTop: '16px',
                  }}
                >
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              <div ref={sentinelRef} style={{ height: '1px' }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
