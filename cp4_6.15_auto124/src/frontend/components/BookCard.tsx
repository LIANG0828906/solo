import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '../types';
import { useStore } from '../store/useStore';

interface BookCardProps {
  book: Book;
  compact?: boolean;
}

export default function BookCard({ book, compact = false }: BookCardProps) {
  const navigate = useNavigate();
  const addToCart = useStore((s) => s.addToCart);
  const [hovered, setHovered] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (book.stock > 0) addToCart(book);
  };

  const stockBadge =
    book.stock === 0
      ? { text: '缺货', cls: 'bg-gray-400 text-white' }
      : book.stock <= 3
      ? { text: `仅剩${book.stock}本`, cls: 'bg-accent-500 text-white animate-pulse-orange' }
      : null;

  return (
    <div
      className={`group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl cursor-pointer
        transition-all duration-300 ease-out ${hovered ? '-translate-y-1' : ''}
        ${compact ? 'flex-shrink-0 w-44' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/book/${book.id}`)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-cream-100">
        <img
          src={book.cover}
          alt={book.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {stockBadge && (
          <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${stockBadge.cls}`}>
            {stockBadge.text}
          </span>
        )}
        <div
          className={`absolute inset-x-0 bottom-0 p-3 transition-all duration-300 ease-out
            ${hovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
        >
          <button
            onClick={handleAdd}
            disabled={book.stock === 0}
            className={`w-full py-2.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2
              transition-all duration-200 shadow-lg
              ${book.stock === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-accent-500 hover:bg-accent-600 active:scale-95'}`}
          >
            <ShoppingCart size={16} />
            {book.stock === 0 ? '暂时缺货' : '加入购物车'}
          </button>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-bold text-brown-800 text-sm leading-snug line-clamp-1">
          {book.title}
        </h3>
        <p className="text-brown-600 text-xs mt-1 line-clamp-1">{book.author}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-accent-600 font-extrabold text-lg">¥{book.price.toFixed(0)}</span>
          <span className="text-xs text-tan-500 bg-cream-200 px-2 py-0.5 rounded-full">
            {book.category}
          </span>
        </div>
      </div>
    </div>
  );
}
