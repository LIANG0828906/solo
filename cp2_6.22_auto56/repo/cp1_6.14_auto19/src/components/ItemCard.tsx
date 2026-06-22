import { useState } from 'react';
import { Heart, Clock } from 'lucide-react';
import type { Item } from '../types';
import { useLazyLoad } from '../hooks/useLazyLoad';
import { cn } from '../lib/utils';

interface ItemCardProps {
  item: Item;
  onClick: () => void;
}

const difficultyColors: Record<Item['difficulty'], string> = {
  easy: 'bg-eco-500',
  medium: 'bg-yellow-600',
  hard: 'bg-red-600',
};

const difficultyLabels: Record<Item['difficulty'], string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export default function ItemCard({ item, onClick }: ItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { ref, isVisible } = useLazyLoad<HTMLDivElement>();

  const beforeImage = item.beforeImages[0]?.url;
  const afterImage = item.afterImages[0]?.url;
  const hasLiked = item.likes.length > 0;

  return (
    <div
      ref={ref}
      className="relative bg-white rounded-xl overflow-hidden shadow-card transition-all duration-300 cursor-pointer hover:shadow-card-hover hover:-translate-y-[3px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="aspect-square bg-primary-50 overflow-hidden relative">
        {!isVisible ? (
          <div className="w-full h-full bg-gray-200 animate-pulse" />
        ) : (
          <>
            {beforeImage && (
              <img
                src={beforeImage}
                alt={item.name}
                className={cn(
                  'object-cover w-full h-full absolute inset-0 transition-opacity duration-500',
                  isHovered && afterImage ? 'opacity-0' : 'opacity-100'
                )}
              />
            )}
            {afterImage && (
              <img
                src={afterImage}
                alt={`${item.name} 改造后`}
                className={cn(
                  'object-cover w-full h-full absolute inset-0 transition-opacity duration-500',
                  isHovered ? 'opacity-100' : 'opacity-0'
                )}
              />
            )}
          </>
        )}
        <span
          className={cn(
            'absolute top-3 left-3 text-white px-2 py-1 rounded-full text-xs font-medium',
            difficultyColors[item.difficulty]
          )}
        >
          {difficultyLabels[item.difficulty]}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-serif text-lg font-semibold text-wood-700 mb-2 line-clamp-1">
          {item.name}
        </h3>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 text-wood-500">
            <Heart
              className={cn(
                'w-4 h-4',
                hasLiked && 'fill-red-500 text-red-500'
              )}
            />
            <span className="text-sm">{item.likes.length}</span>
          </div>
          <div className="flex items-center gap-1 text-wood-400">
            <Clock className="w-4 h-4" />
            <span className="text-xs">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
