import React, { useState } from 'react';
import { Heart, RefreshCw, ShoppingCart, BookOpen } from 'lucide-react';
import type { Book } from './api';

interface BookCardProps {
  book: Book;
  index?: number;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isDeleting?: boolean;
  isCompleted?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  index = 0,
  onClick,
  isFavorite = false,
  onToggleFavorite,
  isDeleting = false,
  isCompleted = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const conditionColors: Record<string, string> = {
    '全新': 'bg-sage text-white',
    '九成新': 'bg-warmOrange text-white',
    '八成新': 'bg-wood text-white',
    '七成新': 'bg-amber-600 text-white',
    '一般': 'bg-gray-500 text-white',
  };

  return (
    <div
      className={`
        masonry-item cursor-pointer
        ${isDeleting ? 'shrink-fade' : ''}
        ${isCompleted ? 'opacity-60 completed-badge' : ''}
      `}
      style={{
        animationDelay: isDeleting ? undefined : `${index * 0.08}s`,
      }}
    >
      <div
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          fade-in-up relative bg-white rounded-2xl overflow-hidden shadow-soft
          transition-all duration-300 ease-out
          ${isHovered ? 'shadow-softHover -translate-y-2 ring-2 ring-warmOrange/40' : ''}
        `}
        style={{ animationDelay: `${index * 0.08}s` }}
      >
        <div className="relative">
          <img
            src={book.coverImage}
            alt={book.title}
            loading="lazy"
            className="w-full h-auto object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=old%20book%20cover%20warm%20vintage&image_size=portrait_4_3';
            }}
          />
          <div
            className={`
              absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium
              ${conditionColors[book.condition] || 'bg-gray-500 text-white'}
            `}
          >
            {book.condition}
          </div>
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-cream/90 backdrop-blur rounded-full text-xs font-semibold text-woodDark">
            {book.courseCode}
          </div>
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="absolute bottom-3 right-3 btn-press p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:bg-white transition-colors"
            >
              <Heart
                size={18}
                className={isFavorite ? 'fill-warmOrange text-warmOrange' : 'text-wood'}
              />
            </button>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-serif font-semibold text-lg text-[#3D2B1F] mb-1 line-clamp-2 leading-tight">
            {book.title}
          </h3>
          <p className="text-sm text-woodDark mb-3">{book.author}</p>

          <div className="flex items-center gap-2 mb-3">
            <img
              src={book.sellerAvatar}
              alt={book.sellerName}
              className="w-6 h-6 rounded-full bg-creamDark"
            />
            <span className="text-sm text-[#3D2B1F]/70">{book.sellerName}</span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              {book.expectedPrice !== undefined ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-warmOrange">
                    ¥{book.expectedPrice}
                  </span>
                  <span className="text-xs text-wood line-through">¥{book.originalPrice}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sage font-semibold">
                  <RefreshCw size={16} />
                  <span>可交换</span>
                </div>
              )}
            </div>

            <div
              className={`
                flex items-center gap-1.5 transition-all duration-300
                ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
              `}
            >
              {book.wantExchange && book.wantExchange.length > 0 ? (
                <span className="btn-press px-3 py-1.5 bg-sage text-white rounded-full text-sm font-medium flex items-center gap-1">
                  <RefreshCw size={14} />
                  交换
                </span>
              ) : null}
              {book.expectedPrice !== undefined && (
                <span className="btn-press px-3 py-1.5 bg-warmOrange text-white rounded-full text-sm font-medium flex items-center gap-1">
                  <ShoppingCart size={14} />
                  购买
                </span>
              )}
              {book.wantExchange && book.wantExchange.length === 0 && book.expectedPrice === undefined && (
                <span className="btn-press px-3 py-1.5 bg-wood text-white rounded-full text-sm font-medium flex items-center gap-1">
                  <BookOpen size={14} />
                  详情
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
