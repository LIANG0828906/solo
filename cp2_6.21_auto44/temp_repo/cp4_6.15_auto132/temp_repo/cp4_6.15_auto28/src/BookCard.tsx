import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from './types';
import { getStatusLabel, getStatusClass, getReadingProgress } from './utils';

interface BookCardProps {
  book: Book;
  index: number;
}

const BookCard: React.FC<BookCardProps> = memo(({ book, index }) => {
  const navigate = useNavigate();
  const progress = getReadingProgress(book.currentPage, book.totalPages);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/books/${book.id}/edit`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/books/${book.id}/edit`);
    }
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/books/${book.id}/track`);
  };

  const firstLetter = book.title?.charAt(0).toUpperCase() || '📖';

  return (
    <div 
      className="book-card" 
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`编辑图书: ${book.title}`}
      style={{ animationDelay: `${index * 50}ms`, cursor: 'pointer' }}
    >
      <div className="book-cover">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} loading="lazy" />
        ) : (
          <div className="book-cover-placeholder">{firstLetter}</div>
        )}
        <span className={`book-status ${getStatusClass(book.readingStatus)}`}>
          {getStatusLabel(book.readingStatus)}
        </span>
      </div>
      <div className="book-info">
        <h3 className="book-title" title={book.title}>{book.title}</h3>
        <p className="book-author">{book.author}</p>
        <span className="book-category">{book.category}</span>
        {book.readingStatus === 'reading' && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-light)' }}>阅读进度</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>{progress}%</span>
            </div>
            <div className="progress-bar" style={{ height: 6 }}>
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%`, transition: 'none' }}
              />
            </div>
            <button 
              className="btn btn-primary btn-sm" 
              style={{ width: '100%', marginTop: 10 }}
              onClick={handleTrackClick}
            >
              记录阅读
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

BookCard.displayName = 'BookCard';

export default BookCard;
