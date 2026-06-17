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

  const hasValidCover = book.coverUrl && book.coverUrl.trim() !== '';
  const showPlaceholder = imageError || !hasValidCover;

  return (
    <div
      className="book-card"
      style={{ minWidth: '200px' }}
      onClick={handleClick}
    >
      <div
        className="book-cover"
        style={{
          height: '70%',
          minHeight: '180px',
        }}
      >
        {!showPlaceholder ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            onError={() => setImageError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              minHeight: '180px',
              background: placeholderColor,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              textAlign: 'center',
              padding: '12px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '8px',
                lineHeight: 1.3,
              }}
            >
              {book.title}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.85 }}>
              暂无封面
            </div>
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
