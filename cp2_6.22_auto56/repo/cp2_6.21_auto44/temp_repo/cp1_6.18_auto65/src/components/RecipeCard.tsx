import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ThumbsUp, Eye } from 'lucide-react';
import useStore from '../store/useStore';
import { Recipe, MatchedRecipe } from '../shared/types';
import './RecipeCard.css';

interface RecipeCardProps {
  recipe: Recipe | MatchedRecipe;
  showMatchPercentage?: boolean;
  lazy?: boolean;
}

function RecipeCard({ recipe, showMatchPercentage = false, lazy = true }: RecipeCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const isFavorite = useStore(state => state.favorites.includes(recipe.id));
  const toggleFavorite = useStore(state => state.toggleFavorite);
  const incrementLikes = useStore(state => state.incrementLikes);

  const matchPercentage = 'matchPercentage' in recipe ? recipe.matchPercentage : 0;

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(recipe.id);
  }, [recipe.id, toggleFavorite]);

  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);
    incrementLikes(recipe.id);
    setTimeout(() => setIsLiking(false), 400);
  }, [recipe.id, incrementLikes, isLiking]);

  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card-link">
      <article className="recipe-card">
        {showMatchPercentage && matchPercentage > 0 && (
          <div className="match-badge">
            食材匹配 {matchPercentage}%
          </div>
        )}

        <div className={`recipe-card-image-wrapper ${!imageLoaded && !imageError ? 'loading' : ''}`}>
          {!imageLoaded && !imageError && <div className="image-placeholder" />}
          {!imageError ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              loading={lazy ? 'lazy' : 'eager'}
              className={`recipe-card-image ${imageLoaded ? 'fade-in' : ''}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="image-error">
              <span>🍽️</span>
            </div>
          )}
        </div>

        <div className="recipe-card-content">
          <h3 className="recipe-card-title">{recipe.title}</h3>
          <p className="recipe-card-description">{recipe.description}</p>

          <div className="recipe-card-footer">
            <div className="recipe-card-stats">
              <span className="stat-item">
                <Eye size={14} />
                {recipe.views}
              </span>
              <button
                className={`stat-item like-btn ${isLiking ? 'liked' : ''}`}
                onClick={handleLikeClick}
              >
                <ThumbsUp size={14} />
                {recipe.likes}
              </button>
            </div>

            <button
              className={`favorite-btn ${isFavorite ? 'active' : ''}`}
              onClick={handleFavoriteClick}
              aria-label={isFavorite ? '取消收藏' : '收藏'}
            >
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}

function arePropsEqual(prev: RecipeCardProps, next: RecipeCardProps) {
  return (
    prev.recipe.id === next.recipe.id &&
    prev.recipe.likes === next.recipe.likes &&
    prev.recipe.views === next.recipe.views &&
    prev.showMatchPercentage === next.showMatchPercentage &&
    prev.lazy === next.lazy
  );
}

export default React.memo(RecipeCard, arePropsEqual);
