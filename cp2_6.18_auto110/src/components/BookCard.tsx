import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import type { Book } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { formatPrice, createRipple } from '@/utils/helpers';

interface BookCardProps {
  book: Book;
  index: number;
}

export const BookCard = ({ book, index }: BookCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    createRipple(e);
    addItem(book);
  };

  return (
    <div
      className="w-full md:w-[240px] h-[360px] flex-shrink-0 bg-white rounded-card shadow-card cursor-pointer overflow-hidden transition-all duration-300 ease-out"
      style={{
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 4px 16px rgba(0,0,0,0.2)'
          : '0 2px 8px rgba(0,0,0,0.1)',
        animationDelay: `${index * 0.05}s`,
        aspectRatio: '240 / 360',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-[240px] flex-shrink-0 bg-gray-100 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        )}
        <img
          src={book.coverUrl}
          alt={book.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        {book.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium">暂时缺货</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col h-[120px] flex-shrink-0 overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-900 truncate mb-1 flex-shrink-0" title={book.title}>
          {book.title}
        </h3>
        <p className="text-xs text-gray-500 mb-2 truncate flex-shrink-0" title={book.author}>
          {book.author}
        </p>
        <div className="mt-auto flex items-center justify-between flex-shrink-0">
          <span className="text-lg font-bold text-accent flex-shrink-0">
            {formatPrice(book.price)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={book.stock === 0}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1 flex-shrink-0 ${
              book.stock === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90 active:scale-95'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            加入购物车
          </button>
        </div>
      </div>
    </div>
  );
};
