import { useState, useEffect, useMemo } from 'react';
import { useBookStore } from '../store/bookStore';
import { useLendingStore } from '../store/lendingStore';
import BookCard from '../modules/book/BookCard';
import BookDetailModal from '../components/BookDetailModal';
import {
  borrowBook,
  getDriftRoute,
  getRecommendedDriftingBooks,
} from '../modules/lending/LendingManager';
import { getAvailableBooks } from '../modules/book/BookManager';
import type { Book, DriftRoutePoint } from '../types';

export default function DriftPage() {
  const books = useBookStore((s) => s.books);
  const records = useLendingStore((s) => s.records);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [selectedBookForDrift, setSelectedBookForDrift] = useState<Book | null>(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const availableBooks = useMemo(() => getAvailableBooks(), [books]);

  const driftingBooks = useMemo(() => {
    const driftingRecords = records.filter(
      (r) => r.returnDate === null && r.isDrifting
    );
    const bookIds = Array.from(new Set(driftingRecords.map((r) => r.bookId)));
    return bookIds
      .map((id) => books.find((b) => b.id === id))
      .filter((b): b is Book => b !== undefined);
  }, [records, books]);

  const handleInitiateDrift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForDrift || !borrowerName.trim()) return;

    setIsSubmitting(true);
    const result = await borrowBook({
      bookId: selectedBookForDrift.id,
      borrowerName: borrowerName.trim(),
      isDrifting: true,
      location: location.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.success) {
      setMessage({ type: 'success', text: '漂流发起成功！' });
      setShowInitiateModal(false);
      setSelectedBookForDrift(null);
      setBorrowerName('');
      setLocation('');
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const DriftRouteVisual = ({ book }: { book: Book }) => {
    const route = getDriftRoute(book.id);
    if (route.length < 2) {
      return (
        <div className="route-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
          </svg>
          <p>暂无漂流记录</p>
        </div>
      );
    }

    return (
      <div className="drift-route-visual">
        <svg className="route-svg" viewBox={`0 0 ${Math.max(600, (route.length - 1) * 180 + 80)} 200`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#1976D2" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#7B1FA2" stopOpacity="0.8" />
            </linearGradient>
            <filter id="routeGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {route.map((point, idx) => {
            if (idx === route.length - 1) return null;
            const x1 = idx * 180 + 40;
            const x2 = (idx + 1) * 180 + 40;
            const midX = (x1 + x2) / 2;
            return (
              <g key={`line-${idx}`}>
                <path
                  d={`M ${x1} 100 Q ${midX} ${idx % 2 === 0 ? 60 : 140} ${x2} 100`}
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="3"
                  filter="url(#routeGlow)"
                />
                <polygon
                  points={`${x2 - 10},${95} ${x2},${100} ${x2 - 10},${105}`}
                  fill="#1976D2"
                />
              </g>
            );
          })}
          {route.map((point, idx) => {
            const x = idx * 180 + 40;
            const isLast = idx === route.length - 1;
            return (
              <g key={`node-${idx}`} className="route-node-group">
                <circle
                  cx={x}
                  cy={100}
                  r={24}
                  fill={isLast ? '#2E7D32' : '#ffffff'}
                  stroke={isLast ? '#2E7D32' : '#1976D2'}
                  strokeWidth="3"
                />
                <text
                  x={x}
                  y={105}
                  textAnchor="middle"
                  fill={isLast ? '#ffffff' : '#1976D2'}
                  fontSize="14"
                  fontWeight="bold"
                >
                  {point.borrowerName.charAt(0)}
                </text>
                <text
                  x={x}
                  y={150}
                  textAnchor="middle"
                  fill="#666"
                  fontSize="12"
                >
                  {point.borrowerName}
                </text>
                <text
                  x={x}
                  y={170}
                  textAnchor="middle"
                  fill="#999"
                  fontSize="11"
                >
                  {formatDate(point.date)}
                </text>
                {point.location && (
                  <text
                    x={x}
                    y={185}
                    textAnchor="middle"
                    fill="#bbb"
                    fontSize="10"
                  >
                    {point.location}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="page drift-page">
      <div className="page-header">
        <div>
          <h1>图书漂流</h1>
          <p className="page-subtitle">让好书在社区中旅行，共 {driftingBooks.length} 本正在漂流</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInitiateModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          发起漂流
        </button>
      </div>

      {message && (
        <div className={`toast ${message.type}`}>
          {message.type === 'success' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      <div className="drift-section">
        <div className="section-header">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
            </svg>
            正在漂流的图书
          </h2>
        </div>
        {driftingBooks.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <p>暂无正在漂流的图书，点击右上角发起第一本！</p>
          </div>
        ) : (
          <div className="drifting-books-list">
            {driftingBooks.map((book) => (
              <div key={book.id} className="drifting-book-card">
                <BookCard book={book} onClick={setSelectedBook} />
                <div className="drifting-route-section">
                  <h4>漂流轨迹</h4>
                  <DriftRouteVisual book={book} />
                  <div className="drift-recommendations">
                    <h5>同类漂流推荐</h5>
                    <div className="recommendation-mini-grid">
                      {getRecommendedDriftingBooks(book, 3).map((rec) => (
                        <div
                          key={rec.id}
                          className="mini-book-card"
                          onClick={() => setSelectedBook(rec)}
                        >
                          <div className="mini-book-letter" style={{ background: getCategoryGradient(rec.category) }}>
                            {rec.title.charAt(0)}
                          </div>
                          <div>
                            <p className="mini-book-title">{rec.title}</p>
                            <p className="mini-book-author">{rec.author}</p>
                          </div>
                        </div>
                      ))}
                      {getRecommendedDriftingBooks(book, 3).length === 0 && (
                        <p className="empty-text small">暂无推荐</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />

      {showInitiateModal && (
        <div className="modal-overlay" onClick={() => setShowInitiateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>发起图书漂流</h2>
              <button className="modal-close" onClick={() => setShowInitiateModal(false)} aria-label="关闭">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleInitiateDrift} className="form">
              <div className="form-group">
                <label>选择图书 *</label>
                <select
                  value={selectedBookForDrift?.id || ''}
                  onChange={(e) => {
                    const book = books.find((b) => b.id === e.target.value);
                    setSelectedBookForDrift(book || null);
                  }}
                  required
                >
                  <option value="">请选择在馆的图书</option>
                  {availableBooks.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} - {book.author} ({book.category})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>漂流发起人（借阅者）*</label>
                <input
                  type="text"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="请输入姓名"
                  required
                />
              </div>
              <div className="form-group">
                <label>漂流地点（选填）</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="如：西城区阅读角"
                />
              </div>
              <div className="form-info-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                漂流中的图书会带有特殊徽章，并在轨迹图中展示流转路线
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowInitiateModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || availableBooks.length === 0}>
                  {isSubmitting ? '发起中...' : '确认发起漂流'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryGradient(category: string): string {
  const colors: Record<string, string> = {
    '小说': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '非虚构': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    '科技': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    '生活': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    '儿童': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  };
  return colors[category] || colors['小说'];
}
