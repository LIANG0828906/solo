import React, { useState } from 'react';
import { Heart, Clock, Star } from 'lucide-react';
import type { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  onToggleFavorite: (id: string, fav: boolean) => void;
  isNew?: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, onToggleFavorite, isNew }) => {
  const [isPulsing, setIsPulsing] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFav = !recipe.isFavorite;
    if (!newFav) {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 500);
    }
    onToggleFavorite(recipe.id, newFav);
  };

  const cardStyle: React.CSSProperties = {
    width: 280,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0,0,0,.08)',
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all .25s ease',
    ...(isNew ? { opacity: 0, transform: 'translateX(-20px)', animation: 'fadeInLeft .4s ease forwards' } : {}),
  };

  const heartStyle: React.CSSProperties = {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 2,
    cursor: 'pointer',
    padding: 6,
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...(isPulsing ? { animation: 'pulse .5s ease' } : {}),
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: 120,
    objectFit: 'cover',
    display: 'block',
  };

  const contentStyle: React.CSSProperties = {
    padding: '12px 16px',
  };

  const nameStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: '#3E2723',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: '0 0 10px 0',
  };

  const bottomRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const starsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  };

  const timeStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    color: '#757575',
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          style={{
            color: i <= recipe.difficulty ? '#FFB300' : '#E0E0E0',
            fill: i <= recipe.difficulty ? '#FFB300' : 'none',
          }}
        />
      );
    }
    return stars;
  };

  return (
    <>
      <div
        style={cardStyle}
        onClick={onClick}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-5px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 20px rgba(255,112,67,.2)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.08)';
        }}
      >
        <div style={heartStyle} onClick={handleFavoriteClick}>
          <Heart
            size={18}
            style={{
              color: recipe.isFavorite ? '#E53935' : '#9E9E9E',
              fill: recipe.isFavorite ? '#E53935' : 'none',
            }}
          />
        </div>
        <img src={recipe.image} alt={recipe.name} style={imageStyle} />
        <div style={contentStyle}>
          <h3 style={nameStyle}>{recipe.name}</h3>
          <div style={bottomRowStyle}>
            <div style={starsStyle}>{renderStars()}</div>
            <div style={timeStyle}>
              <Clock size={14} />
              <span>{recipe.cookTime}分钟</span>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default RecipeCard;
