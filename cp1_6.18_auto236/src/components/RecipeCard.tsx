import React from 'react';

interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  cookTime: number;
  matchPercentage: number;
  missingIngredients: string[];
  existingIngredients: string[];
}

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onViewMissing: (recipe: Recipe) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = React.memo(({
  recipe,
  isFavorite,
  onToggleFavorite,
  onViewMissing,
}) => {
  const [isAnimating, setIsAnimating] = React.useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    onToggleFavorite(recipe.id);
    setTimeout(() => setIsAnimating(false), 200);
  };

  return (
    <div
      style={{
        width: '300px',
        height: '200px',
        borderRadius: '16px',
        backgroundColor: '#fff',
        border: '2px solid #E8E8E8',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#FF6B6B';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 107, 107, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#E8E8E8';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#333',
            margin: 0,
          }}
        >
          {recipe.name}
        </h3>
        <button
          onClick={handleFavoriteClick}
          style={{
            width: '32px',
            height: '32px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transform: isAnimating ? 'scale(0.8)' : 'scale(1)',
            transition: 'transform 0.2s ease',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={isFavorite ? '#FF6B6B' : 'none'}
            stroke={isFavorite ? '#FF6B6B' : '#CCC'}
            strokeWidth="2"
            style={{ transition: 'fill 0.2s ease, stroke 0.2s ease' }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '13px', color: '#666' }}>匹配度</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>
            {recipe.matchPercentage}%
          </span>
        </div>
        <div
          style={{
            height: '8px',
            borderRadius: '4px',
            backgroundColor: '#E0E0E0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${recipe.matchPercentage}%`,
              background: 'linear-gradient(90deg, #4FC3F7, #6BCB77)',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span style={{ fontSize: '13px', color: '#666' }}>{recipe.cookTime}分钟</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewMissing(recipe);
          }}
          style={{
            padding: '6px 12px',
            borderRadius: '16px',
            border: 'none',
            backgroundColor: '#FFF0EE',
            color: '#FF6B6B',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FF6B6B';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFF0EE';
            e.currentTarget.style.color = '#FF6B6B';
          }}
        >
          查看缺失
        </button>
      </div>
    </div>
  );
});

RecipeCard.displayName = 'RecipeCard';

export default RecipeCard;
