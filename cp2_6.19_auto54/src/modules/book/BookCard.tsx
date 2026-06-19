import { useState } from 'react';
import { BookOpen, RefreshCw, ArrowRight } from 'lucide-react';
import type { Book } from '../../shared/types';
import { getAuthorInitial, getRandomLightColor, getStatusLabel, getExchangeModeLabel } from '../../shared/utils';
import { useExchangeStore } from '../exchange/ExchangeEngine';
import { useAuthStore } from '../user/UserManager';

interface BookCardProps {
  book: Book;
  isNew?: boolean;
  animationDelay?: number;
  isOverdue?: boolean;
}

export function BookCard({ book, isNew, animationDelay = 0, isOverdue }: BookCardProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const createRequest = useExchangeStore((state) => state.createRequest);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn());
  const currentUser = useAuthStore((state) => state.currentUser);

  const coverBg = getRandomLightColor(book.id);
  const initial = getAuthorInitial(book.author);

  const handleRequest = async (type: 'exchange' | 'borrow') => {
    if (!isLoggedIn || !currentUser) {
      return;
    }
    setIsRequesting(true);
    setTimeout(() => {
      createRequest(book.id, type);
      setIsRequesting(false);
    }, 300);
  };

  const canExchange = book.exchangeMode !== 'borrow_only' && book.availableQuantity > 0;
  const canBorrow = book.exchangeMode !== 'exchange_only' && book.availableQuantity > 0;
  const isDisabled = book.availableQuantity <= 0 || isRequesting;

  const cardClasses = [
    'book-card',
    isNew ? 'new-book' : '',
    animationDelay > 0 ? 'fade-in-item' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      style={animationDelay > 0 ? { animationDelay: `${animationDelay}ms` } : undefined}
    >
      <div className="book-cover" style={{ backgroundColor: coverBg }}>
        <span className={`book-status-tag ${isOverdue ? 'overdue' : book.status}`}>
          {isOverdue ? '逾期' : getStatusLabel(book.status)}
        </span>
        <span className="book-cover-initial">{initial}</span>
      </div>

      <div className="book-info">
        <h3 className="book-title" title={book.title}>{book.title}</h3>
        <p className="book-author">{book.author}</p>
        <div className="book-meta">
          <span className="meta-tag">{book.category}</span>
          <span className="meta-tag">{getExchangeModeLabel(book.exchangeMode)}</span>
          <span className="meta-tag">库存: {book.availableQuantity}/{book.totalQuantity}</span>
        </div>
      </div>

      <div className="book-actions">
        {canExchange && (
          <button
            className="btn btn-secondary btn-full"
            onClick={() => handleRequest('exchange')}
            disabled={isDisabled}
          >
            <RefreshCw size={16} />
            交换
          </button>
        )}
        {canBorrow && (
          <button
            className="btn btn-primary btn-full"
            onClick={() => handleRequest('borrow')}
            disabled={isDisabled}
          >
            <ArrowRight size={16} />
            借阅
          </button>
        )}
        {!canExchange && !canBorrow && (
          <button className="btn btn-full" disabled style={{ opacity: 0.6 }}>
            <BookOpen size={16} />
            暂无库存
          </button>
        )}
      </div>
    </div>
  );
}
