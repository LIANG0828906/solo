import React, { useState } from 'react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onToggleFavorite: (id: string) => void;
  onClick: (id: string) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onToggleFavorite, onClick }) => {
  const [animating, setAnimating] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    onToggleFavorite(recipe.id);
    setTimeout(() => setAnimating(false), 200);
  };

  const renderStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < difficulty ? '#f5a623' : '#ddd', fontSize: '14px' }}>
        ★
      </span>
    ));
  };

  return (
    <div
      className="recipe-card"
      onClick={() => onClick(recipe.id)}
    >
      <div className="recipe-card-image-wrapper">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.title} className="recipe-card-image" />
        ) : (
          <div className="recipe-card-image-placeholder" />
        )}
        <button
          className={`recipe-card-favorite${animating ? ' animating' : ''}`}
          onClick={handleFavoriteClick}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={recipe.isFavorite ? '#e74c3c' : 'none'} stroke={recipe.isFavorite ? '#e74c3c' : '#999'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
      <div className="recipe-card-content">
        <h3 className="recipe-card-title">{recipe.title}</h3>
        <div className="recipe-card-meta">
          <span className="recipe-card-time">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {recipe.cookTime}分钟
          </span>
          <span className="recipe-card-difficulty">
            {renderStars(recipe.difficulty)}
          </span>
        </div>
        <div className="recipe-card-rating">
          <span style={{ color: '#f5a623' }}>★</span>
          <span className="recipe-card-rating-value">{recipe.rating.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
