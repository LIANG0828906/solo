import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import CircularProgress from './CircularProgress';
import { updateProgress } from '../apiService';

interface BookCardProps {
  book: Book;
  onProgressUpdate?: (bookId: string, currentPage: number) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onProgressUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const progress = book.totalPages > 0
    ? Math.round((book.currentPage / book.totalPages) * 100)
    : 0;

  const remainingPages = book.totalPages - book.currentPage;

  const handleProgressClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isUpdating || book.currentPage >= book.totalPages) return;

    setIsUpdating(true);
    try {
      const newPage = Math.min(book.currentPage + 10, book.totalPages);
      await updateProgress(book.id, { currentPage: newPage });
      onProgressUpdate?.(book.id, newPage);
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Link
      to={`/book/${book.id}`}
      style={{
        display: 'block',
        backgroundColor: 'var(--color-card)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        textDecoration: 'none',
        color: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      <div style={{ position: 'relative', height: '80px' }}>
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            style={{
              width: '100%',
              height: '80px',
              objectFit: 'cover',
              borderRadius: '12px 12px 0 0',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '80px',
              background: 'linear-gradient(135deg, var(--color-accent-light), var(--color-accent))',
              borderRadius: '12px 12px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}
          >
            📖
          </div>
        )}

        <div
          onClick={handleProgressClick}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            cursor: isUpdating ? 'wait' : 'pointer',
            opacity: isUpdating ? 0.6 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          <CircularProgress
            size={52}
            strokeWidth={4}
            progress={progress}
          />
        </div>
      </div>

      <div style={{ padding: '12px 16px 16px' }}>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 700,
            marginBottom: '4px',
            color: 'var(--color-text)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.4,
            minHeight: '44px',
          }}
        >
          {book.title}
        </h3>

        <p
          style={{
            fontSize: '14px',
            color: 'var(--color-text-light)',
            marginBottom: '12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {book.author}
        </p>

        <div
          style={{
            fontSize: '13px',
            color: 'var(--color-text-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>📄</span>
          <span>还剩{remainingPages}页</span>
        </div>
      </div>
    </Link>
  );
};

export default BookCard;
