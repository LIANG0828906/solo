import { useState, useEffect } from 'react';
import { Book } from '../types';
import { useNavigate } from 'react-router-dom';

interface BookCardProps {
  book: Book;
}

const statusLabels: Record<string, string> = {
  available: '可借',
  borrowed: '已借出',
  in_transit: '在途'
};

const statusIcons: Record<string, string> = {
  available: '✓',
  borrowed: '✗',
  in_transit: '↻'
};

function BookCard({ book }: BookCardProps) {
  const navigate = useNavigate();
  const [statusChanging, setStatusChanging] = useState(false);
  const [prevStatus, setPrevStatus] = useState(book.status);

  useEffect(() => {
    if (book.status !== prevStatus) {
      setStatusChanging(true);
      setPrevStatus(book.status);
      const timer = setTimeout(() => setStatusChanging(false), 300);
      return () => clearTimeout(timer);
    }
  }, [book.status, prevStatus]);

  const handleClick = () => {
    navigate(`/book/${book.id}`);
  };

  return (
    <div className="book-card" onClick={handleClick}>
      <div className="book-cover">
        <img src={book.cover} alt={book.title} loading="lazy" />
      </div>
      <div className="book-info">
        <div className="book-title">{book.title}</div>
        <div className="book-meta">
          <span className="book-author">{book.author}</span>
          <span className={`status-tag ${book.status} ${statusChanging ? 'changing' : ''}`}>
            <span className="status-icon">{statusIcons[book.status]}</span>
            {statusLabels[book.status]}
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${book.readingProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default BookCard;
