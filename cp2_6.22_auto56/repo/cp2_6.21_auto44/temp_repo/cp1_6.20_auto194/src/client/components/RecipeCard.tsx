import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Recipe } from '../../shared/types';
import { useState } from 'react';

interface RecipeCardProps {
  recipe: Recipe;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  delay?: number;
  imageLoaded: Record<string, boolean>;
  onImageLoad: (id: string) => void;
}

export const RecipeCard = ({
  recipe,
  onToggleFavorite,
  delay = 0,
  imageLoaded,
  onImageLoad,
}: RecipeCardProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(recipe.id, !recipe.isFavorite);
  };

  const animationStyle: React.CSSProperties = {
    animationDelay: `${delay}ms`,
    opacity: 0,
  };

  return (
    <div
      className="card cursor-pointer fade-in overflow-hidden"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={animationStyle}
    >
      <div className="relative" style={{ height: '60%' }}>
        <img
          src={recipe.image}
          alt={recipe.name}
          className="recipe-image"
          loading="lazy"
          style={{
            opacity: imageLoaded[recipe.id] ? 1 : 0,
            transition: 'opacity 0.3s ease',
            height: '200px',
            width: '100%',
          }}
          onLoad={() => onImageLoad(recipe.id)}
        />
        {!imageLoaded[recipe.id] && (
          <div
            className="absolute inset-0 bg-gray-200 animate-pulse"
            style={{ height: '200px' }}
          />
        )}
        <button
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
          onClick={handleFavoriteClick}
          style={{ minWidth: '36px', minHeight: '36px' }}
        >
          <Heart
            size={20}
            fill={recipe.isFavorite ? '#e74c3c' : 'none'}
            color={recipe.isFavorite ? '#e74c3c' : '#999'}
          />
        </button>
      </div>
      <div className="p-4" style={{ height: '40%' }}>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>
          {recipe.name}
        </h3>
        <p className="text-sm line-clamp-2" style={{ color: 'var(--text-light)' }}>
          {recipe.description}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--primary)' }}>
            {recipe.cookTime}分钟
          </span>
          <div className="flex gap-1">
            {Array.from({ length: recipe.difficulty }).map((_, i) => (
              <span key={i} className="text-sm">🍳</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
