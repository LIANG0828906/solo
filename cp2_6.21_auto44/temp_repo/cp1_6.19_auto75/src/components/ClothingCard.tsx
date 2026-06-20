import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClothingItem } from '../types';
import { CarbonRating } from './CarbonRating';
import { fabricData } from '../data/clothing';
import { carbonTracker } from '../services/CarbonTracker';
import { useAppStore } from '../store/useAppStore';

interface ClothingCardProps {
  clothing: ClothingItem;
  index?: number;
}

export function ClothingCard({ clothing, index = 0 }: ClothingCardProps) {
  const navigate = useNavigate();
  const setCurrentClothing = useAppStore((state) => state.setCurrentClothing);

  const carbonScore = useMemo(() => {
    return carbonTracker.calculate(
      clothing.defaultFabric,
      clothing.complexity,
      clothing.baseCarbonScore
    );
  }, [clothing]);

  const fabricName = fabricData[clothing.defaultFabric].name;

  const handleClick = () => {
    setCurrentClothing(clothing);
    navigate(`/detail/${clothing.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20"
      style={{
        animationDelay: `${index * 0.1}s`
      }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${Object.values(clothing.defaultColors)[0]}40 0%, ${Object.values(clothing.defaultColors)[1] || Object.values(clothing.defaultColors)[0]}20 100%)`
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 200 300" className="w-2/3 h-2/3 drop-shadow-xl">
            <defs>
              <linearGradient id={`dress-${clothing.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                {Object.values(clothing.defaultColors).map((color, i) => (
                  <stop
                    key={i}
                    offset={`${(i / (Object.values(clothing.defaultColors).length - 1)) * 100}%`}
                    stopColor={color}
                  />
                ))}
              </linearGradient>
            </defs>
            <path
              d="M100,30 Q70,60 65,100 L55,250 Q100,280 145,250 L135,100 Q130,60 100,30"
              fill={`url(#dress-${clothing.id})`}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1.5"
            />
            <circle cx="100" cy="25" r="15" fill="rgba(255,255,255,0.6)" />
          </svg>
        </div>

        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
          <span className="text-xs font-medium text-emerald-700">{fabricName}</span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <span className="text-white text-sm font-medium">点击查看详情</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            {clothing.name}
          </h3>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <img
            src={clothing.designerAvatar}
            alt={clothing.designer}
            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <span className="text-sm text-gray-600">
            {clothing.designer}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <CarbonRating score={carbonScore} size={14} />
          <span className="text-xs text-gray-400">
            复杂度: {clothing.complexity.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
