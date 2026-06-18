import React, { useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Recipe } from '@/models/recipeTypes';
import { useRecipeStore } from '@/store/recipeStore';

const PARTICLE_COUNT_MIN = 8;
const PARTICLE_COUNT_MAX = 12;
const PARTICLE_DURATION = 300;

const particleStyleId = 'recipe-card-particle-keyframes';

function injectParticleKeyframes() {
  if (document.getElementById(particleStyleId)) return;
  const style = document.createElement('style');
  style.id = particleStyleId;
  style.textContent = `
    @keyframes recipeParticleBurst {
      0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

function spawnParticles(container: HTMLElement) {
  injectParticleKeyframes();
  const count = Math.floor(Math.random() * (PARTICLE_COUNT_MAX - PARTICLE_COUNT_MIN + 1)) + PARTICLE_COUNT_MIN;
  const colors = ['var(--color-accent)', 'var(--color-secondary)', '#ff6b6b', '#ffd93d', '#ff8a5c'];
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('span');
    const size = 4 + Math.random() * 6;
    const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
    const distance = 20 + Math.random() * 25;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${colors[i % colors.length]};
      top: 50%;
      left: 50%;
      pointer-events: none;
      animation: recipeParticleBurst ${PARTICLE_DURATION}ms ease-out forwards;
      --tx: ${tx}px;
      --ty: ${ty}px;
    `;
    particle.style.animation = `recipeParticleBurst ${PARTICLE_DURATION}ms ease-out forwards`;
    particle.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.3)`, opacity: 0 },
      ],
      { duration: PARTICLE_DURATION, easing: 'ease-out', fill: 'forwards' }
    );
    container.appendChild(particle);
    setTimeout(() => particle.remove(), PARTICLE_DURATION + 50);
  }
}

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const navigate = useNavigate();
  const { favorites, toggleFavorite, getRecipeAverageRating } = useRecipeStore();
  const favBtnRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);

  const isFavorited = favorites.includes(recipe.id);
  const avgRating = getRecipeAverageRating(recipe.id);
  const fullStars = Math.round(avgRating);

  const handleCardClick = useCallback(() => {
    navigate(`/recipe/${recipe.id}`);
  }, [navigate, recipe.id]);

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFavorite(recipe.id);
      if (!isFavorited && favBtnRef.current) {
        spawnParticles(favBtnRef.current);
      }
    },
    [toggleFavorite, recipe.id, isFavorited]
  );

  const cardStyle: React.CSSProperties = {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: hovered ? 'var(--color-primary)' : '#fff',
    boxShadow: hovered
      ? '0 8px 24px rgba(212, 165, 116, 0.35)'
      : '0 2px 8px rgba(0, 0, 0, 0.08)',
    transition: 'box-shadow 0.3s ease, background-color 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    filter: hovered ? 'brightness(1.03)' : 'brightness(1)',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: 180,
    objectFit: 'cover',
    display: 'block',
  };

  const infoStyle: React.CSSProperties = {
    padding: '12px 16px 16px',
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const metaStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    fontSize: 13,
    color: '#888',
  };

  const starsStyle: React.CSSProperties = {
    marginTop: 8,
    fontSize: 14,
    letterSpacing: 1,
  };

  const favBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.85)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    color: isFavorited ? 'var(--color-accent)' : '#ccc',
    transition: 'color 0.2s, transform 0.2s',
    zIndex: 2,
    padding: 0,
    lineHeight: 1,
  };

  return (
    <div
      style={cardStyle}
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
    >
      <img src={recipe.coverImage} alt={recipe.title} style={imageStyle} />

      <button
        ref={favBtnRef}
        style={favBtnStyle}
        onClick={handleFavoriteClick}
        aria-label={isFavorited ? '取消收藏' : '收藏'}
      >
        {isFavorited ? '❤️' : '🤍'}
      </button>

      <div style={infoStyle}>
        <h3 style={titleStyle}>{recipe.title}</h3>
        <div style={starsStyle}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              style={{ color: star <= fullStars ? 'var(--color-accent)' : '#ddd' }}
            >
              ★
            </span>
          ))}
        </div>
        <div style={metaStyle}>
          <span>{recipe.authorName}</span>
          <span>{recipe.cookTime}分钟</span>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
