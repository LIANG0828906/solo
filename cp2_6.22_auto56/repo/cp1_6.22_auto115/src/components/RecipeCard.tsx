import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating';
import type { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        borderRadius: '12px',
        background: 'white',
        boxShadow: 'var(--shadow)',
        transition: 'all 0.3s ease',
        width: '100%',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow)';
      }}
    >
      <div
        style={{
          height: '180px',
          background: recipe.coverGradient,
          display: 'flex',
          alignItems: 'flex-end',
          padding: '16px',
        }}
      >
        <span
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '12px',
            color: '#2D6A4F',
          }}
        >
          {recipe.category}
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}
        >
          {recipe.name}
        </h3>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <img
            src={recipe.authorAvatar}
            alt={recipe.author}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
          <span
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}
          >
            {recipe.author}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>{recipe.cookTime}分钟</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}
          >
            <StarRating value={recipe.avgRating} size="sm" />
            <span>{recipe.avgRating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
