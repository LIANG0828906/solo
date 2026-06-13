import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useLazyImage } from '../hooks/useLazyImage';
import RatingStars from './RatingStars';
import { cuisineLabel, difficultyLabel, difficultyColor } from '../utils/helpers';
import type { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  fadeKey?: string | number;
}

export default function RecipeCard({ recipe, fadeKey }: RecipeCardProps) {
  const navigate = useNavigate();
  const { isFavorite, addFavorite, removeFavorite, showToast } = useStore();
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
        showToast('已取消收藏', 'info');
      } else {
        addFavorite(recipe.id);
        showToast('收藏成功！', 'success');
      }
      setHeartAnimating(true);
      setTimeout(() => setHeartAnimating(false), 400);
    },
    [favorite, recipe.id, addFavorite, removeFavorite, showToast]
  );

  return (
    <div
      className={`recipe-card ${fadeKey !== undefined ? 'fade-in' : ''}`}
      key={fadeKey}
      onClick={handleCardClick}
    >
      <div style={{ position: 'relative', width: '100%', lineHeight: 0 }}>
        {!loaded && (
          <div className="skeleton" style={{ aspectRatio: '4/3', width: '100%' }} />
        )}
        <img
          ref={ref}
          src={loaded ? recipe.thumbnail : undefined}
          alt={recipe.name}
          style={{
            width: '100%',
            height: 'auto',
            display: loaded ? 'block' : 'none',
            objectFit: 'cover',
          }}
        />
        <button
          onClick={handleFavoriteClick}
          aria-label={favorite ? '取消收藏' : '收藏'}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            transform: heartAnimating ? 'scale(1)' : undefined,
            animation: heartAnimating ? 'heart-bounce 0.4s ease' : undefined,
            zIndex: 2,
          }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20"
            fill={favorite ? '#FF6F00' : 'none'}
            stroke={favorite ? '#FF6F00' : '#666'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
      <div style={{ padding: '14px 16px 18px' }}>
        <div style={{
          fontSize: 16, fontWeight: 600, color: 'var(--text)',
          marginBottom: 8, lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {recipe.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <RatingStars value={recipe.rating} size={14} />
          <span style={{ fontSize: 12, color: '#999' }}>
            {recipe.rating.toFixed(1)} ({recipe.ratingCount})
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
            background: difficultyColor(recipe.difficulty), color: 'white',
          }}>
            {difficultyLabel(recipe.difficulty)}
          </span>
          <span style={{
            padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
            background: 'rgba(255,111,0,0.12)', color: 'var(--primary)',
          }}>
            {cuisineLabel(recipe.cuisine)}
          </span>
          <span style={{
            padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
            background: 'rgba(0,0,0,0.05)', color: 'var(--text-light)',
          }}>
            ⏱ {recipe.cookTime}分钟
          </span>
        </div>
      </div>
    </div>
  );
}
