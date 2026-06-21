import React from 'react';
import { Heart, Clock } from 'lucide-react';
import type { Recipe } from '../types';
import './RecipeCard.css';

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
  onClick?: () => void;
  delay?: number;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isFavorite = false,
  onFavoriteToggle,
  onClick,
  delay = 0
}) => {
  const [liked, setLiked] = React.useState(isFavorite);
  const [animating, setAnimating] = React.useState(false);

  React.useEffect(() => {
    setLiked(isFavorite);
  }, [isFavorite]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !liked;
    setLiked(newState);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    onFavoriteToggle?.(recipe.id, newState);
  };

  const formatCookTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  return (
    <div
      className="recipe-card"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="recipe-card-image">
        <img src={recipe.coverImage} alt={recipe.name} loading="lazy" />
        <button
          className={`favorite-btn ${liked ? 'liked' : ''} ${animating ? 'animating' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={liked ? '取消收藏' : '收藏'}
        >
          <Heart size={22} fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="recipe-card-content">
        <h3 className="recipe-card-title">{recipe.name}</h3>
        <div className="recipe-card-meta">
          <span className="cook-time">
            <Clock size={14} />
            {formatCookTime(recipe.cookTime)}
          </span>
        </div>
        <div className="recipe-card-tags">
          {recipe.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag-chip">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
