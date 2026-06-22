import { memo, useState, useEffect } from 'react';
import type { Book } from '../api';

interface BookCardProps {
  book: Book;
  isNew?: boolean;
  onOpenNotes: (book: Book) => void;
  onUpdateProgress: (id: string, page: number) => void;
}

function BookCardInner({ book, isNew, onOpenNotes, onUpdateProgress }: BookCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [animateNew, setAnimateNew] = useState(false);

  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setAnimateNew(true), 10);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  const progress = book.totalPages > 0 ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100)) : 0;
  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference - (progress / 100) * circumference;

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    } catch {
      return d;
    }
  };

  const handleFlipClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.note-btn') || target.closest('.progress-edit')) {
      return;
    }
    setFlipped((v) => !v);
  };

  return (
    <div className={`book-card-wrapper ${animateNew ? 'spring-in' : ''}`}>
      <div
        className={`book-card ${flipped ? 'flipped' : ''}`}
        onClick={handleFlipClick}
        style={{ cursor: 'pointer' }}
      >
        {/* Front */}
        <div className="book-face book-face-front">
          <div className="book-cover" style={{ background: book.coverUrl }}>
            <div className="book-cover-title">{book.title}</div>
            <div className="book-cover-author">{book.author}</div>
          </div>
        </div>

        {/* Back */}
        <div className="book-face book-face-back">
          <div className="card-title-mini">{book.title}</div>

          <div className="progress-ring-wrap">
            <svg width="86" height="86" viewBox="0 0 86 86">
              <circle
                cx="43"
                cy="43"
                r="36"
                fill="none"
                stroke="rgba(139, 94, 60, 0.15)"
                strokeWidth="7"
              />
              <circle
                cx="43"
                cy="43"
                r="36"
                fill="none"
                stroke="#2E4A2A"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 43 43)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              <text x="43" y="46" textAnchor="middle" className="progress-text">
                {progress}%
              </text>
            </svg>
          </div>

          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-label">
            {book.currentPage} / {book.totalPages} 页
          </div>

          <div className="meta-row">
            📅 开始：<strong>{formatDate(book.startDate)}</strong>
          </div>
          <div className="meta-row">
            ⏱ 上次：<strong>{book.lastReadMinutes} 分钟</strong>
          </div>

          <button
            className="note-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenNotes(book);
            }}
          >
            📝 添加笔记
          </button>
        </div>
      </div>
    </div>
  );
}

export const BookCard = memo(BookCardInner);
BookCardInner.displayName = 'BookCard';
export default BookCard;
