import React, { useCallback } from 'react';
import type { Book, PriorityLevel } from '@/types';
import { getPriorityLevel, getPriorityColor, calculatePriorityScore } from '@/utils/priority';

interface BookCardProps {
  book: Book;
  onClick: () => void;
  totalWantToRead: number;
}

const BookCard = React.memo(function BookCard({ book, onClick, totalWantToRead }: BookCardProps) {
  const level: PriorityLevel = book.status === 'want-to-read'
    ? getPriorityLevel(book.priority, totalWantToRead)
    : 'low';
  const dotColor = getPriorityColor(level);
  const score = book.status === 'want-to-read'
    ? calculatePriorityScore(book.priority + 1, book.difficulty)
    : 0;

  return (
    <div className="book-card" onClick={onClick}>
      <div className="priority-dot" style={{ backgroundColor: dotColor }} />
      <div className="book-cover-placeholder">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="book-cover-img" />
        ) : (
          <div className="book-cover-spine">
            <div className="spine-line" />
            <span className="cover-title">{book.title.slice(0, 6)}</span>
          </div>
        )}
      </div>
      <div className="book-card-info">
        <h4 className="book-card-title">{book.title}</h4>
        <p className="book-card-author">{book.author}</p>
        {book.publishYear && <p className="book-card-year">{book.publishYear}</p>}
      </div>
      {book.status === 'want-to-read' && (
        <div className="priority-score">{score}</div>
      )}
      <div className={`status-badge status-${book.status}`}>
        {book.status === 'want-to-read' ? '想读' : book.status === 'reading' ? '在读' : '读完'}
      </div>
    </div>
  );
});

export default BookCard;
