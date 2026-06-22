import React, { useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes, BookDragItem } from '../types';
import type { IBook } from '../types';

interface BookCardProps {
  book: IBook;
  source: 'shelf' | 'exhibition' | 'theme';
  themeId?: string;
  showRemove?: boolean;
  isNew?: boolean;
  onRemove?: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, source, themeId, showRemove, isNew, onRemove }) => {
  const [{ isDragging }, drag] = useDrag<BookDragItem, unknown, { isDragging: boolean }>(
    () => ({
      type: ItemTypes.BOOK,
      item: {
        type: ItemTypes.BOOK,
        bookId: book.id,
        source,
        themeId,
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [book.id, source, themeId]
  );

  const getBadgeText = useCallback(() => {
    switch (book.category) {
      case 'fiction':
        return '虚构';
      case 'non-fiction':
        return '非虚构';
      default:
        return '';
    }
  }, [book.category]);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div
      ref={drag}
      className={`book-card ${isDragging ? 'dragging' : ''} ${isNew ? 'theme-book-wrapper' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1, position: 'relative' }}
    >
      {showRemove && (
        <button
        type="button"
        className="theme-remove-btn"
        onClick={handleRemove}
        style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#D85A5A',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          zIndex: 2,
          opacity: 0,
          transition: 'opacity 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0';
        }}
      >
        ×
      </button>
      )}
      <span className={`book-badge ${book.category}`}>{getBadgeText()}</span>
      <img src={book.cover} alt={book.title} className="book-cover" />
      <div className="book-info">
        <h3 className="book-title" title={book.title}>
          {book.title}
        </h3>
        <p className="book-author" title={book.author}>
          {book.author}
        </p>
        <p className="book-price">¥{book.price.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default BookCard;
