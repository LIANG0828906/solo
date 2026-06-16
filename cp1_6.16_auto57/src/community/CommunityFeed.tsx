import { useState, useEffect, useCallback, useMemo } from 'react';
import { database } from '../db/database';
import { FeedCard } from './FeedCard';
import { SwapRequest } from '../swap/SwapRequest';
import { Book } from '../types';
import { Loader2, TrendingUp } from 'lucide-react';

const PAGE_SIZE = 20;

interface CommunityFeedProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function CommunityFeed({ showToast }: CommunityFeedProps) {
  const currentUser = database.getCurrentUser();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [swapBook, setSwapBook] = useState<Book | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const loadBooks = () => {
      setIsInitialLoading(true);
      setTimeout(() => {
        const books = database
          .getBooks()
          .filter((b) => b.ownerId !== currentUser.id);
        setAllBooks(books);
        setIsInitialLoading(false);
      }, 300);
    };
    loadBooks();
    return database.subscribe(loadBooks);
  }, [currentUser.id]);

  const visibleBooks = useMemo(
    () => allBooks.slice(0, visibleCount),
    [allBooks, visibleCount]
  );

  const hasMore = visibleCount < allBooks.length;

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setVisibleCount((prev) => prev + PAGE_SIZE);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore]);

  const getUser = (id: string) => database.getUserById(id);

  const handleRequestSwap = useCallback((book: Book) => {
    setSwapBook(book);
  }, []);

  return (
    <div className="page-container page-transition">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TrendingUp size={24} style={{ marginRight: '8px' }} />
            社区动态
          </h1>
          <p className="page-subtitle">
            看看其他书友最近添加了什么好书
          </p>
        </div>
      </div>

      {isInitialLoading ? (
        <div className="waterfall-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton-feed-card">
              <div className="skeleton-header">
                <div className="skeleton-avatar" />
                <div className="skeleton-lines">
                  <div className="skeleton-line w-1/2" />
                  <div className="skeleton-line w-3/4" />
                </div>
              </div>
              <div className="skeleton-cover" />
              <div className="skeleton-content">
                <div className="skeleton-line w-3/4" />
                <div className="skeleton-line w-1/2" />
              </div>
              <div className="skeleton-line w-1/3" />
            </div>
          ))}
        </div>
      ) : allBooks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌐</div>
          <p className="empty-text">社区还没有动态</p>
          <p className="empty-subtext">成为第一个分享书籍的人吧！</p>
        </div>
      ) : (
        <>
          <div className="waterfall-grid">
            {visibleBooks.map((book) => (
              <FeedCard
                key={book.id}
                book={book}
                owner={getUser(book.ownerId)}
                onRequestSwap={handleRequestSwap}
              />
            ))}
          </div>

          {hasMore && (
            <div className="load-more-container">
              <button
                className="btn btn-secondary btn-load-more"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    加载中...
                  </>
                ) : (
                  '加载更多'
                )}
              </button>
            </div>
          )}
        </>
      )}

      <SwapRequest
        isOpen={!!swapBook}
        onClose={() => setSwapBook(null)}
        targetBook={swapBook}
        onSuccess={() => {
          showToast('交换请求已发送！', 'success');
          setSwapBook(null);
        }}
        onError={(message) => {
          showToast(message, 'error');
        }}
      />
    </div>
  );
}
