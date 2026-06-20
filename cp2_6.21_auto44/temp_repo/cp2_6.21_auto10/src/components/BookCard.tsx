import { memo } from 'react';
import type { Book } from '../types';

interface BookCardProps {
  book: Book;
  isSelected: boolean;
  onClick: () => void;
}

const statusLabels: Record<Book['status'], string> = {
  unread: '未读',
  reading: '在读',
  finished: '读完'
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export const BookCard = memo(function BookCard({
  book,
  isSelected,
  onClick
}: BookCardProps) {
  const progress = Math.max(0, Math.min(100, book.progress));

  return (
    <div
      className={`book-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <img
        src={book.coverUrl}
        alt={book.title}
        className="book-cover"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src =
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="100%25" height="100%25" fill="%23f0ebe0"/><text x="50%25" y="50%25" fill="%238b7355" font-family="Georgia" font-size="14" text-anchor="middle" dy=".3em">无封面</text></svg>';
        }}
      />
      <span className={`status-badge status-${book.status}`}>
        {statusLabels[book.status]}
      </span>
      <h3 className="book-title" title={book.title}>
        {book.title}
      </h3>
      <p className="book-author">{book.author}</p>
      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}>
            <span className="progress-text">{progress}%</span>
          </div>
        </div>
      </div>
      <p className="last-updated">最后更新：{formatDate(book.lastUpdated)}</p>
    </div>
  );
});
