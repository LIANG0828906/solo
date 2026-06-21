import { useNavigate } from 'react-router-dom';
import { Book } from '../types';

interface BookCardProps {
  book: Book;
}

const BookCard = ({ book }: BookCardProps) => {
  const navigate = useNavigate();

  const renderStars = (rating: number) => {
    return (
      <span style={{ color: '#f1c40f', fontSize: '12px' }}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i}>{i < Math.floor(rating) ? '★' : '☆'}</span>
        ))}
      </span>
    );
  };

  return (
    <div
      onClick={() => navigate(`/books/${book.id}`)}
      style={{
        background: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease-out',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '2/3',
          marginBottom: '12px',
          borderRadius: '4px',
          overflow: 'hidden',
          background: '#f0ede8',
        }}
      >
        <img
          src={book.cover_url}
          alt={book.title}
          style={{
            width: '120px',
            height: '180px',
            objectFit: 'cover',
            display: 'block',
            margin: '0 auto',
          }}
        />
      </div>
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '6px',
          color: '#333',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {book.title}
      </h3>
      <p
        style={{
          fontSize: '12px',
          color: '#888',
          marginBottom: '8px',
        }}
      >
        {book.author}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {renderStars(book.rating)}
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            color: '#fff',
            background: book.status === 'available' ? '#27ae60' : '#e67e22',
          }}
        >
          {book.status === 'available' ? '在架' : '借出'}
        </span>
      </div>
    </div>
  );
};

export default BookCard;
