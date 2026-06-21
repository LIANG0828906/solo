import React, { useState } from 'react';
import type { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite: boolean;
  onFavoriteToggle: (id: string) => void;
  onClick: (recipe: Recipe) => void;
  isRecommended?: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isFavorite,
  onFavoriteToggle,
  onClick,
  isRecommended = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardClicked, setCardClicked] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    onFavoriteToggle(recipe.id);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleCardClick = () => {
    setCardClicked(true);
    setTimeout(() => {
      setCardClicked(false);
      onClick(recipe);
    }, 300);
  };

  return (
    <div
      className={`recipe-card ${cardClicked ? 'card-clicked' : ''}`}
      onClick={handleCardClick}
    >
      {isRecommended && (
        <div className="recommend-badge">推荐</div>
      )}
      <div className="card-image-wrapper">
        <img
          src={recipe.image}
          alt={recipe.name}
          className="card-image"
          loading="lazy"
        />
        <button
          className={`favorite-btn ${isFavorite ? 'favorited' : ''} ${isAnimating ? 'animating' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? '取消收藏' : '收藏'}
        >
          <svg
            viewBox="0 0 24 24"
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            className="heart-icon"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
      <div className="card-content">
        <h3 className="card-title">{recipe.name}</h3>
        <div className="card-meta">
          <span className="cook-time">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="meta-icon">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            {recipe.cookTime}
          </span>
          <span className="rating">
            <svg viewBox="0 0 24 24" fill="#FFD700" className="star-icon">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" />
            </svg>
            {recipe.rating.toFixed(1)}
          </span>
        </div>
        <div className="tags-container">
          {recipe.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
