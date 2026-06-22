import { useState } from 'react';
import { Check, X, Loader2, BookOpen } from 'lucide-react';
import { SwapRequest, Book, User } from '../types';
import { getCategoryColor, getInitials } from '../utils/colors';

interface SwapItemProps {
  request: SwapRequest;
  requester: User | undefined;
  requestedBook: Book | undefined;
  offeredBook: Book | undefined;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function SwapItem({
  request,
  requester,
  requestedBook,
  offeredBook,
  onAccept,
  onReject,
}: SwapItemProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    onAccept(request.id);
    setIsAccepting(false);
  };

  const handleReject = async () => {
    setIsRejecting(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    onReject(request.id);
    setIsRejecting(false);
  };

  if (!requester || !requestedBook || !offeredBook) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="swap-item">
      <div className="swap-item-header">
        <div className="swap-item-user">
          <div
            className="swap-item-avatar"
            style={{ backgroundColor: requester.avatarColor }}
          >
            {getInitials(requester.username)}
          </div>
          <div>
            <h4 className="swap-item-username">{requester.username}</h4>
            <p className="swap-item-time">{formatDate(request.createdAt)}</p>
          </div>
        </div>
        <span className={`swap-status ${request.status}`}>
          {request.status === 'pending' && '待处理'}
          {request.status === 'accepted' && '已接受'}
          {request.status === 'rejected' && '已拒绝'}
        </span>
      </div>

      <div className="swap-item-books">
        <div className="swap-book-mini">
          <div className="swap-book-mini-label">想交换你的</div>
          <div className="swap-book-mini-card">
            <div
              className="swap-book-mini-cover"
              style={{ backgroundColor: getCategoryColor(requestedBook.category) }}
            >
              <BookOpen size={16} />
            </div>
            <div className="swap-book-mini-info">
              <p className="swap-book-mini-title">《{requestedBook.title}》</p>
              <p className="swap-book-mini-author">{requestedBook.author}</p>
            </div>
          </div>
        </div>

        <div className="swap-item-arrow">⟷</div>

        <div className="swap-book-mini">
          <div className="swap-book-mini-label">对方提供</div>
          <div className="swap-book-mini-card">
            <div
              className="swap-book-mini-cover"
              style={{ backgroundColor: getCategoryColor(offeredBook.category) }}
            >
              <BookOpen size={16} />
            </div>
            <div className="swap-book-mini-info">
              <p className="swap-book-mini-title">《{offeredBook.title}》</p>
              <p className="swap-book-mini-author">{offeredBook.author}</p>
            </div>
          </div>
        </div>
      </div>

      {request.status === 'pending' && (
        <div className="swap-item-actions">
          <button
            className="btn btn-reject"
            onClick={handleReject}
            disabled={isAccepting || isRejecting}
          >
            {isRejecting ? (
              <Loader2 size={16} className="spinner" />
            ) : (
              <X size={16} />
            )}
            拒绝
          </button>
          <button
            className="btn btn-accept"
            onClick={handleAccept}
            disabled={isAccepting || isRejecting}
          >
            {isAccepting ? (
              <Loader2 size={16} className="spinner" />
            ) : (
              <Check size={16} />
            )}
            接受
          </button>
        </div>
      )}
    </div>
  );
}
