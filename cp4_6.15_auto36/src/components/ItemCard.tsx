import { useNavigate } from 'react-router-dom';
import type { Item } from '../types';
import { getDaysLeft, getConditionLabel } from '../utils';

interface ItemCardProps {
  item: Item;
  index?: number;
}

const imageHeights = [180, 200, 220, 240, 260, 160];

export const ItemCard = ({ item, index = 0 }: ItemCardProps) => {
  const navigate = useNavigate();
  const daysLeft = getDaysLeft(item.createdAt);
  const imgHeight = imageHeights[item.id.charCodeAt(item.id.length - 1) % imageHeights.length];

  const handleClick = () => {
    navigate(`/item/${item.id}`);
  };

  return (
    <div
      className="masonry-item card-hover cursor-pointer"
      onClick={handleClick}
      style={{
        animation: `fade-in-up 0.4s ease-out ${index * 0.05}s both`,
      }}
    >
      <div className="bg-white rounded-3xl overflow-hidden shadow-md">
        <div className="relative">
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full object-cover"
            style={{ height: `${imgHeight}px` }}
            loading="lazy"
          />
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-xs px-3 py-1 rounded-full font-semibold text-orange-600">
              {item.categories[0]}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                daysLeft <= 5
                  ? 'bg-red-100 text-red-500'
                  : daysLeft <= 10
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-green-100 text-green-600'
              }`}
            >
              剩 {daysLeft} 天
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-base mb-2 line-clamp-1">{item.title}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">成色</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < Math.ceil(item.condition / 2)
                        ? 'bg-orange-400'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {getConditionLabel(item.condition)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
