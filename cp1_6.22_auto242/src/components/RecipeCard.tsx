import React from 'react';
import type { Recipe } from '../types';
import { FAMILY_COLORS } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  const barColor = FAMILY_COLORS[recipe.targetNote] || '#C9A96E';

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#F9F5EB',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(60,36,21,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        height: '6px',
        backgroundColor: barColor,
      }} />
      
      <div style={{ padding: '16px' }}>
        <div style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#3C2415',
          fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
          marginBottom: '6px',
        }}>
          {recipe.name}
        </div>
        
        <div style={{
          display: 'inline-block',
          padding: '2px 10px',
          backgroundColor: barColor,
          color: '#FDFBF7',
          fontSize: '11px',
          fontWeight: 500,
          borderRadius: '10px',
          fontFamily: "'Inter', sans-serif",
          marginBottom: '10px',
        }}>
          {recipe.targetNote}调
        </div>
        
        <p style={{
          fontSize: '13px',
          color: '#8B7355',
          fontFamily: "'Inter', sans-serif",
          lineHeight: 1.5,
          margin: '0 0 12px 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {recipe.description}
        </p>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#A6967C',
          fontFamily: "'Inter', sans-serif",
        }}>
          <span>{recipe.ingredients.length} 种原料</span>
          <span>{recipe.versions.length} 个版本</span>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
