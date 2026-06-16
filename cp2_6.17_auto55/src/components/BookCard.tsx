import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '../types';

interface BookCardProps {
  book: Book;
}

const BookCard = ({ book }: BookCardProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    navigate(`/books/${book.id}`);
  };

  const coverColors = ['#8B4513', '#A0522D', '#CD853F', '#B8860B', '#D2691E', '#8B7355'];
  const colorIndex = book.title.charCodeAt(0) % coverColors.length;
  const placeholderColor = coverColors[colorIndex];

  return (
    <div
      className="book-card"
      style={{ minWidth: '200px' }}
      onClick={handleClick}
    >
      <div className="book-cover">
        {!imageError ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: placeholderColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            {book.title}
          </div>
        )}
      </div>
      <div className="book-info">
        <div className="book-title">{book.title}</div>
        <div className="book-author">{book.author}</div>
      </div>
    </div>
  );
};

export default BookCard;
