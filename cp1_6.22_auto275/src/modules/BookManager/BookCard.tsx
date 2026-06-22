import React from 'react';
import { StarFilled } from '@ant-design/icons';
import { Book } from '@/types';

interface BookCardProps {
  book: Book;
  onClick?: (book: Book) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  const renderStars = (level: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <StarFilled 
        key={i} 
        className="hot-star" 
        style={{ opacity: i < level ? 1 : 0.2 }} 
      />
    ));
  };

  return (
    <div className="book-card fade-in" onClick={() => onClick?.(book)}>
      <div className="book-cover" style={{ background: book.coverColor }}>
        <div className="hot-stars">
          {renderStars(book.hotLevel)}
        </div>
        <div className="book-title-short">
          {book.title.slice(1, 3)}
        </div>
      </div>
      <div className="book-info">
        <div className="book-title" title={book.title}>
          {book.title}
        </div>
        <div className="book-author">{book.author}</div>
        <div className="book-meta">
          <span className="book-category">{book.category}</span>
          <span className="book-stock">库存: {book.stock}</span>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
