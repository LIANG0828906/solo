import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useLazyImage } from '../hooks/useLazyImage';
import RatingStars from './RatingStars';
import {
  cuisineLabel,
  difficultyLabel,
  difficultyColor,
} from '../utils/helpers';
import type { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  fadeKey?: string | number;
}

export default function RecipeCard({ recipe, fadeKey }: RecipeCardProps) {
  const navigate = useNavigate();
  const { isFavorite, addFavorite, removeFavorite } = useStore();
  const { ref, loaded } = useLazyImage();
  const [heartAnimating, setHeartAnimating] = useState(false);

  const favorite = isFavorite(recipe.id);

  const handleCardClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (favorite) {
        removeFavorite(recipe.id);
      } else {
        addFavorite(recipe.id);
      }

      setHeartAnimating(true);
      setTimeout(() => setHeartAnimating(false), 400);
    },
    [favorite, recipe.id, addFavorite, removeFavorite]
  );

  return (
    <div
      className={`recipe-card ${fadeKey !== undefined ? 'fade-in' : ''}`}
      key={fadeKey}
      onClick={handleCardClick}
    >
      <div className="recipe-card-image-wrapper">
        <img
          ref={ref}
          src={loaded ? recipe.coverImage : undefined}
          data-src={recipe.coverImage}
          alt={recipe.title}
          className={`recipe-card-image ${loaded ? 'loaded' : ''}`}
        />
        <button
          className={`recipe-card-favorite ${heartAnimating ? 'animating' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={favorite ? '取消收藏' : '收藏'}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill={favorite ? '#FF6F00' : 'none'}
            stroke={favorite ? '#FF6F00' : '#666'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
      <div className="recipe-card-info">
        <div className="recipe-card-title">{recipe.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RatingStars value={recipe.rating} size={16} />
          <span style={{ fontSize: '12px', color: '#999' }}>
            ({recipe.ratingCount})
          </span>
        </div>
        <div className="recipe-card-tags">
          <span
            className="recipe-card-tag"
            style={{ backgroundColor: difficultyColor(recipe.difficulty) }}
          >
            {difficultyLabel(recipe.difficulty)}
          </span>
          <span className="recipe-card-tag cuisine">{cuisineLabel(recipe.cuisine)}</span>
        </div>
      </div>
    </div>
  );
}
