import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from '../store';
import { BookOpen } from 'lucide-react';

interface BookCardProps {
  book: Book;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/book/${book.id}`);
  };

  return (
    <div className="book-card" onClick={handleClick}>
      <div className="book-card-cover">
        <span className="category-tag">{book.category}</span>
        <BookOpen className="book-icon" />
      </div>
      <div className="book-card-content">
        <h3 className="book-card-title">{book.title}</h3>
        <p className="book-card-author">作者：{book.author}</p>
        <div className="book-card-tags">
          {book.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
