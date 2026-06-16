import { useState } from 'react';
import type { Book } from '../../types';
import { getStatusColor } from './BookManager';

interface BookCardProps {
  book: Book;
  onClick?: (book: Book) => void;
}

export default function BookCard({ book, onClick }: BookCardProps) {
  const [imageError, setImageError] = useState(false);
  const firstLetter = book.title.charAt(0);
  const statusColor = getStatusColor(book.status);

  const letterColors: Record<string, string> = {
    '小说': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '非虚构': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    '科技': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    '生活': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    '儿童': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  };

  return (
    <div
      className="book-card"
      onClick={() => onClick?.(book)}
    >
      <div className="book-cover">
        {book.coverUrl && !imageError ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div
            className="book-placeholder"
            style={{ background: letterColors[book.category] }}
          >
            <span>{firstLetter}</span>
          </div>
        )}
        {book.status === '漂流' && (
          <div className="drift-badge" title="漂流中">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="book-info">
        <h3 className="book-title" title={book.title}>{book.title}</h3>
        <p className="book-author">{book.author}</p>
        <div className="book-meta">
          <span
            className="status-tag"
            style={{ backgroundColor: statusColor + '20', color: statusColor, borderColor: statusColor + '40' }}
          >
            {book.status}
          </span>
          <span className="category-tag">{book.category}</span>
        </div>
      </div>
    </div>
  );
}
