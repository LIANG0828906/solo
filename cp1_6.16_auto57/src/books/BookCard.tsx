import { useState } from 'react';
import { Edit2, Trash2, SwapHorizontal } from 'lucide-react';
import { Book } from '../types';
import { getCategoryColor } from '../utils/colors';
import { database } from '../db/database';

interface BookCardProps {
  book: Book;
  isOwner: boolean;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
  onRequestSwap?: (book: Book) => void;
  isFiltered?: boolean;
  showHighlight?: boolean;
}

export function BookCard({
  book,
  isOwner,
  onEdit,
  onDelete,
  onRequestSwap,
  isFiltered = false,
  showHighlight = false,
}: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const coverColor = getCategoryColor(book.category);
  const user = database.getUserById(book.ownerId);

  const handleCardClick = () => {
    if (!isOwner && book.isAvailable && onRequestSwap) {
      onRequestSwap(book);
    }
  };

  return (
    <div
      className={`book-card ${isFiltered ? 'filtered' : ''} ${showHighlight ? 'highlight' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {isOwner && (
        <div className={`book-card-actions ${isHovered ? 'visible' : ''}`}>
          <button
            className="book-card-action-btn edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(book);
            }}
          >
            <Edit2 size={14} />
          </button>
          <button
            className="book-card-action-btn delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(book.id);
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div
        className="book-card-cover"
        style={{ backgroundColor: coverColor }}
      >
        <span className="book-card-category">{book.category}</span>
        <div className="book-card-status">
          <span className={`status-dot ${book.isAvailable ? 'available' : 'unavailable'}`} />
          <span className="status-text">
            {book.isAvailable ? '可交换' : '不可交换'}
          </span>
        </div>
      </div>

      <div className="book-card-info">
        <h4 className="book-card-title" title={book.title}>
          {book.title}
        </h4>
        <p className="book-card-author">{book.author}</p>
        {!isOwner && user && (
          <p className="book-card-owner">所有者：{user.username}</p>
        )}
      </div>

      {!isOwner && book.isAvailable && (
        <div className="book-card-swap-overlay">
          <SwapHorizontal size={24} />
          <span>我想交换</span>
        </div>
      )}
    </div>
  );
}
