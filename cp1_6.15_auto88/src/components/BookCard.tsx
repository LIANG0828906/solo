import { Clock } from 'lucide-react';
import type { Book } from '../types';

interface BookCardProps {
  book: Book;
  onBorrow: (bookId: string) => void;
  onReturn: (bookId: string) => void;
  onViewHistory: (bookId: string) => void;
}

export default function BookCard({ book, onBorrow, onReturn, onViewHistory }: BookCardProps) {
  return (
    <div className="book-card">
      <img
        className="book-cover"
        src={book.cover}
        alt={book.title}
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://placehold.co/200x280/4a5568/FFFFFF/png?text=封面';
        }}
      />
      <h3 className="book-title">{book.title}</h3>
      <p className="book-author">作者：{book.author}</p>
      {book.status === 'available' ? (
        <span className="status-tag status-available">✓ 在架上</span>
      ) : (
        <>
          <span className="status-tag status-borrowed">✗ 已借出</span>
          {book.borrower && <p className="borrower-info">借阅者：{book.borrower}</p>}
        </>
      )}
      {book.status === 'available' ? (
        <button className="action-btn btn-borrow" onClick={() => onBorrow(book.id)}>
          立即借阅
        </button>
      ) : (
        <button className="action-btn btn-return" onClick={() => onReturn(book.id)}>
          归还图书
        </button>
      )}
      <a
        className="history-link"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onViewHistory(book.id);
        }}
      >
        <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
        查看借阅历史
      </a>
    </div>
  );
}
