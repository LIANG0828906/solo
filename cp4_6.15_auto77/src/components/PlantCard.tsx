import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Plant } from '../types';
import { generateGradientColor, useStore } from '../store';

interface PlantCardProps {
  plant: Plant;
  onClick?: () => void;
  isNew?: boolean;
  isSearchResult?: boolean;
}

function DifficultyStars({ difficulty }: { difficulty: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <i
          key={i}
          className={`text-xs ${i <= difficulty ? 'fas fa-star text-gold-500' : 'far fa-star text-gray-300'}`}
        />
      ))}
    </div>
  );
}

export default function PlantCard({ plant, onClick, isNew, isSearchResult }: PlantCardProps) {
  const navigate = useNavigate();
  const clearNewPlantMarker = useStore((s) => s.clearNewPlantMarker);
  const [showRemoveAnim, setShowRemoveAnim] = useState(false);
  const gradient = generateGradientColor(plant.name);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => {
        clearNewPlantMarker(plant.id);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isNew, plant.id, clearNewPlantMarker]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/plant/${plant.id}`);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRemoveAnim(true);
  };

  const animClass = showRemoveAnim
    ? 'card-remove'
    : isNew
    ? 'new-plant-card'
    : isSearchResult
    ? 'search-result'
    : '';

  return (
    <div
      onClick={handleClick}
      className={`card-shadow rounded-card bg-white overflow-hidden cursor-pointer ${animClass}`}
      style={{ animationFillMode: 'both' }}
    >
      <div className="relative">
        <div
          className="w-full aspect-square flex items-center justify-center relative"
          style={{ background: gradient }}
        >
          {plant.photos.length > 0 ? (
            <img
              src={plant.photos[0]}
              alt={plant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-white text-center">
              <i className="fas fa-leaf text-5xl opacity-70 mb-2 block"></i>
              <span className="text-lg font-bold tracking-wider opacity-80">
                {plant.name.charAt(0)}
              </span>
            </div>
          )}
          <span
            className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
              plant.status === 'available'
                ? 'bg-olive-600 text-white'
                : 'bg-gray-400 text-white'
            }`}
          >
            {plant.status === 'available' ? '待领养' : '已领养'}
          </span>
          {onClick && (
            <button
              onClick={handleRemove}
              className="absolute bottom-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 hover:scale-110"
            >
              <i className="fas fa-trash-alt text-xs"></i>
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-800 text-base mb-2 font-merriweather">
          {plant.name}
        </h3>
        <div className="flex items-center justify-between">
          <DifficultyStars difficulty={plant.difficulty} />
          <span className="text-xs text-gray-400">
            {plant.difficulty <= 2 ? '容易' : plant.difficulty <= 3 ? '中等' : '困难'}
          </span>
        </div>
      </div>
    </div>
  );
}
