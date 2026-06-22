import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, User } from '../types';
import { getCategoryColor, getInitials } from '../utils/colors';
import { SwapHorizontal, User as UserIcon } from 'lucide-react';

interface FeedCardProps {
  book: Book;
  owner: User | undefined;
  onRequestSwap?: (book: Book) => void;
}

export function FeedCard({ book, owner, onRequestSwap }: FeedCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleSwapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRequestSwap && book.isAvailable) {
      onRequestSwap(book);
    }
  };

  const handleViewShelf = () => {
    navigate(`/user/${owner?.id}#${book.id}`);
  };

  if (!owner) return null;

  return (
    <div
      className="feed-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleViewShelf}
    >
      <div className="feed-card-header">
        <div
          className="feed-card-avatar"
          style={{ backgroundColor: owner.avatarColor }}
        >
          {getInitials(owner.username)}
        </div>
        <div className="feed-card-user-info">
          <p className="feed-card-username">{owner.username}</p>
          <p className="feed-card-time">
            {new Date(book.createdAt).toLocaleDateString('zh-CN', {
              month: 'short',
              day: 'numeric',
            })}
            添加了新书
          </p>
        </div>
      </div>

      <div className="feed-card-book">
        <div
          className="feed-card-cover"
          style={{ backgroundColor: getCategoryColor(book.category) }}
        >
          <span className="feed-card-category">{book.category}</span>
          {book.isAvailable && (
            <div className="feed-card-available">
              <span className="status-dot available" />
              可交换
            </div>
          )}
        </div>
        <div className="feed-card-info">
          <h4 className="feed-card-title">{book.title}</h4>
          <p className="feed-card-author">{book.author}</p>
        </div>
      </div>

      <div className="feed-card-actions">
        <button
          className={`btn btn-swap ${!book.isAvailable ? 'disabled' : ''}`}
          onClick={handleSwapClick}
          disabled={!book.isAvailable}
        >
          <SwapHorizontal size={16} />
          {book.isAvailable ? '想交换' : '已被交换'}
        </button>
      </div>
    </div>
  );
}
