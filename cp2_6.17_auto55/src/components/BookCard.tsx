import { useNavigate } from 'react-router-dom';
import type { Book } from '../types';

interface BookCardProps {
  book: Book;
}

const BookCard = ({ book }: BookCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      className="book-card"
      style={{ minWidth: '200px' }}
      onClick={() => navigate(`/books/${book.id}`)}
    >
      <div className="book-cover">
        <img src={book.coverUrl} alt={book.title} />
      </div>
      <div className="book-info">
        <div className="book-title">{book.title}</div>
        <div className="book-author">{book.author}</div>
      </div>
    </div>
  );
};

export default BookCard;
