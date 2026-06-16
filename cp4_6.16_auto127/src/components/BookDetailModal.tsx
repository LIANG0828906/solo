import { useState, useEffect } from 'react';
import type { Book } from '../types';
import { getStatusColor } from '../modules/book/BookManager';
import { getDriftRoute, getLendingHistory, getRecommendedDriftingBooks } from '../modules/lending/LendingManager';
import { useBookStore } from '../store/bookStore';
import BookCard from '../modules/book/BookCard';
import type { LendingRecord, DriftRoutePoint } from '../types';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
}

export default function BookDetailModal({ book, onClose }: BookDetailModalProps) {
  const [imageError, setImageError] = useState(false);
  const [history, setHistory] = useState<LendingRecord[]>([]);
  const [route, setRoute] = useState<DriftRoutePoint[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);

  useEffect(() => {
    if (book) {
      setImageError(false);
      setHistory(getLendingHistory(book.id));
      setRoute(getDriftRoute(book.id));
      setRecommendations(getRecommendedDriftingBooks(book, 3));
    }
  }, [book]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!book) return null;

  const books = useBookStore((s) => s.books);
  useEffect(() => {
    const updated = books.find((b) => b.id === book.id);
    if (updated && (updated.status !== book.status || updated.coverUrl !== book.coverUrl)) {
      setHistory(getLendingHistory(book.id));
    }
  }, [books, book.id, book.status, book.coverUrl]);

  const firstLetter = book.title.charAt(0);
  const statusColor = getStatusColor(book.status);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const letterColors: Record<string, string> = {
    '小说': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '非虚构': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    '科技': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    '生活': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    '儿童': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content book-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="关闭">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="book-detail-header">
          <div className="book-detail-cover large">
            {book.coverUrl && !imageError ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                className="book-placeholder large"
                style={{ background: letterColors[book.category] }}
              >
                <span>{firstLetter}</span>
              </div>
            )}
          </div>
          <div className="book-detail-info">
            <h2>{book.title}</h2>
            <p className="detail-author">作者：{book.author}</p>
            <div className="detail-tags">
              <span
                className="status-tag"
                style={{ backgroundColor: statusColor + '20', color: statusColor, borderColor: statusColor + '40' }}
              >
                {book.status}
              </span>
              <span className="category-tag">{book.category}</span>
              <span className="condition-tag">品相：{book.condition}</span>
              {book.isbn && <span className="isbn-tag">ISBN：{book.isbn}</span>}
            </div>
          </div>
        </div>

        {route.length > 1 && (
          <div className="detail-section">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              漂流路线
            </h3>
            <div className="drift-route">
              {route.map((point, idx) => (
                <div key={idx} className="route-point">
                  <div className="route-node">
                    <span>{point.borrowerName.charAt(0)}</span>
                  </div>
                  <div className="route-info">
                    <p className="route-name">{point.borrowerName}</p>
                    <p className="route-date">{formatDate(point.date)}{point.location ? ` · ${point.location}` : ''}</p>
                  </div>
                  {idx < route.length - 1 && <div className="route-line" />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="detail-section">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            借阅记录（{history.length}）
          </h3>
          {history.length === 0 ? (
            <p className="empty-text">暂无借阅记录</p>
          ) : (
            <div className="history-list">
              {history.slice(0, 5).map((record) => {
                const overdue = !record.returnDate && record.dueDate < Date.now();
                return (
                  <div key={record.recordId} className={`history-item ${overdue ? 'overdue' : ''}`}>
                    <div className="history-user">
                      <div className="user-avatar">{record.borrowerName.charAt(0)}</div>
                      <div>
                        <p className="history-name">{record.borrowerName}</p>
                        <p className="history-dates">
                          {formatDate(record.borrowDate)} → {record.returnDate ? formatDate(record.returnDate) : '未归还'}
                        </p>
                      </div>
                    </div>
                    {record.isDrifting && <span className="drift-mini-tag">漂流</span>}
                    {overdue && (
                      <span className="overdue-tag">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        超期
                      </span>
                    )}
                  </div>
                );
              })}
              {history.length > 5 && <p className="more-text">还有 {history.length - 5} 条记录...</p>}
            </div>
          )}
        </div>

        {recommendations.length > 0 && (
          <div className="detail-section">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              同类漂流推荐
            </h3>
            <div className="recommendation-grid">
              {recommendations.map((rec) => (
                <BookCard key={rec.id} book={rec} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
