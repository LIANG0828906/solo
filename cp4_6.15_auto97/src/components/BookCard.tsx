import { useNavigate } from 'react-router-dom';
import type { Book } from '@/types';
import { useStore } from '@/store';

interface BookCardProps {
  book: Book;
  index?: number;
}

export default function BookCard({ book, index = 0 }: BookCardProps) {
  const navigate = useNavigate();
  const { addToCart } = useStore();

  const getStockBadgeClass = (stock: number) => {
    if (stock > 10) return 'green';
    if (stock > 0) return 'yellow';
    return 'red';
  };

  const handleViewDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/book/${book.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (book.stock > 0) {
      addToCart(book);
    }
  };

  return (
    <div 
      className="card book-card" 
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={handleViewDetail}
    >
      <div className="book-image-wrapper">
        <div className={`stock-badge ${getStockBadgeClass(book.stock)}`}></div>
        <img 
          src={book.coverUrl} 
          alt={book.title} 
          className="book-image"
          loading="lazy"
        />
        <div className="book-overlay">
          <button className="overlay-btn" onClick={handleViewDetail}>
            <i className="fas fa-info-circle"></i> 查看详情
          </button>
          <button 
            className="overlay-btn" 
            onClick={handleAddToCart}
            disabled={book.stock === 0}
            style={{ opacity: book.stock === 0 ? 0.5 : 1 }}
          >
            <i className="fas fa-cart-plus"></i> 加入购物车
          </button>
        </div>
      </div>
      <div className="book-info">
        <h3 className="book-title" title={book.title}>{book.title}</h3>
        <p className="book-author">{book.author}</p>
        <p className="book-price">¥{book.price.toFixed(2)}</p>
      </div>
    </div>
  );
}
