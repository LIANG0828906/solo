import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HeritageItem } from '@/types';
import { cn } from '@/lib/utils';

interface HeritageCardProps {
  item: HeritageItem;
  index?: number;
  onClick?: () => void;
}

export default function HeritageCard({ item, index, onClick }: HeritageCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const fullStars = Math.floor(item.averageRating);
  const hasHalf = item.averageRating - fullStars >= 0.5;

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => {
      if (onClick) {
        onClick();
      } else {
        navigate(`/heritage/${item.id}`);
      }
    }, 300);
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      let fillType: 'full' | 'half' | 'empty' = 'empty';
      if (i <= fullStars) {
        fillType = 'full';
      } else if (i === fullStars + 1 && hasHalf) {
        fillType = 'half';
      }

      stars.push(
        <svg
          key={i}
          className="w-4 h-4 inline-block align-middle"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`half-star-grad-${item.id}-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="50%" stopColor="#C05A3A" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={fillType === 'full' ? '#C05A3A' : fillType === 'half' ? `url(#half-star-grad-${item.id}-${i})` : 'transparent'}
            stroke={fillType === 'empty' ? 'rgba(192, 90, 58, 0.3)' : '#C05A3A'}
            strokeWidth="1.5"
          />
        </svg>
      );
    }
    return stars;
  };

  return (
    <div
      className={cn(
        'group relative rounded-2xl overflow-hidden bg-white shadow-md card-hover break-inside-avoid mb-5 animate-fadeInUp',
        clicked && 'scale-110 opacity-0 transition-all duration-300'
      )}
      style={{ animationDelay: `${(index || 0) * 50}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent flex flex-col justify-end items-center transition-opacity duration-300 z-10 px-4 pb-6',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
      >
        <button className="bg-terracotta text-white rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-terracotta-dark hover:-translate-y-0.5 hover:shadow-lg active:scale-95">
          查看详情
        </button>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden bg-cream-light">
        {item.images[0] ? (
          <img
            src={item.images[0]}
            alt={item.name}
            className="rounded-full w-24 h-24 object-cover mx-auto mt-4 shadow-lg ring-4 ring-white"
          />
        ) : (
          <div className="rounded-full w-24 h-24 bg-terracotta/20 mx-auto mt-4 shadow-lg ring-4 ring-white flex items-center justify-center">
            <span className="text-terracotta text-2xl font-serif">遗</span>
          </div>
        )}
      </div>

      <div className="p-4 text-center">
        <h3 className="font-serif font-semibold text-navy text-lg mb-2 transition-colors duration-200 group-hover:text-terracotta">
          {item.name}
        </h3>
        <span
          className={cn(
            'pill-region mb-2',
            `region-${item.region || '其他'}`
          )}
        >
          {item.region || '其他'}
        </span>
        <div className="mt-2">
          {renderStars()}
          <span className="text-sm font-semibold text-terracotta ml-1">
            {item.averageRating.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
