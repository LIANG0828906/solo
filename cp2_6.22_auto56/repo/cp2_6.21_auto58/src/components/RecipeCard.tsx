import React from 'react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const cardBaseStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '12px',
  padding: '16px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  position: 'relative',
  border: '2px solid transparent',
  fontFamily: "'Quicksand', sans-serif",
};

const cardHoverStyle: React.CSSProperties = {};

const selectedStyle: React.CSSProperties = {
  border: '2px solid #D4A574',
  background: '#FAF3E7',
};

const checkboxContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  left: '12px',
  zIndex: 10,
};

const checkboxStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  cursor: 'pointer',
  accentColor: '#D4A574',
};

const favoriteButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  right: '12px',
  zIndex: 10,
  background: 'rgba(255, 255, 255, 0.9)',
  border: 'none',
  borderRadius: '50%',
  padding: '4px 8px',
  cursor: 'pointer',
  fontSize: '22px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  transition: 'transform 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const imageContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '160px',
  borderRadius: '8px',
  overflow: 'hidden',
  marginBottom: '12px',
  background: '#F5E6CC',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const imageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const placeholderStyle: React.CSSProperties = {
  fontSize: '64px',
};

const nameStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#4A2F1A',
  marginBottom: '8px',
};

const metaContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '14px',
  color: '#6B5344',
};

const metaItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isSelected,
  onToggleSelect,
  onClick,
  isFavorite,
  onToggleFavorite,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const combinedStyle: React.CSSProperties = {
    ...cardBaseStyle,
    ...(isSelected ? selectedStyle : {}),
    ...(isHovered
      ? {
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          transform: 'translateY(-4px)',
        }
      : {}),
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    onClick();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite();
  };

  return (
    <div
      style={combinedStyle}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={checkboxContainerStyle} onClick={handleCheckboxClick}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          style={checkboxStyle}
        />
      </div>

      <button
        onClick={handleFavoriteClick}
        style={favoriteButtonStyle}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.2)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        <span style={{ color: isFavorite ? '#E91E63' : '#CCCCCC' }}>
          {isFavorite ? '❤️' : '🤍'}
        </span>
      </button>

      <div style={imageContainerStyle}>
        {recipe.image_data ? (
          <img src={recipe.image_data} alt={recipe.name} style={imageStyle} />
        ) : (
          <span style={placeholderStyle}>🍳</span>
        )}
      </div>

      <div style={nameStyle}>{recipe.name}</div>

      <div style={metaContainerStyle}>
        <div style={metaItemStyle}>
          <span>⏱️</span>
          <span>{recipe.cooking_time}分钟</span>
        </div>
        <div style={metaItemStyle}>
          <span>🥗</span>
          <span>{recipe.ingredients.length}种食材</span>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
