import React from 'react';
import type { Book } from '../types';

interface BookCardProps {
  book: Book;
  index: number;
  onClick: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, index, onClick }) => {
  return (
    <div
      className="book-card"
      onClick={onClick}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div
        className="book-spine"
        style={{ background: book.coverGradient }}
      >
        <div className="book-title">{book.title}</div>
        <div className="book-author">{book.author}</div>
      </div>
      {book.isBorrowed ? (
        <div className="borrowed-seal" title="已借出" />
      ) : (
        <div className="borrow-status">在架可阅</div>
      )}
    </div>
  );
};

export default BookCard;
