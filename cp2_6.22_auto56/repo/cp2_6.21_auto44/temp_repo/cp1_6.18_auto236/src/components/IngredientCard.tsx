import React from 'react';

interface Ingredient {
  id: string;
  name: string;
  category: 'vegetable' | 'seafood' | 'staple' | 'meat';
}

const categoryColors: Record<string, string> = {
  vegetable: '#FF6B6B',
  seafood: '#4FC3F7',
  staple: '#FFD93D',
  meat: '#6BCB77',
};

interface IngredientCardProps {
  ingredient: Ingredient;
  onRemove: (id: string) => void;
}

const IngredientCard: React.FC<IngredientCardProps> = React.memo(({ ingredient, onRemove }) => {
  const bgColor = categoryColors[ingredient.category];

  return (
    <div
      style={{
        width: '100%',
        height: '60px',
        borderRadius: '12px',
        backgroundColor: `${bgColor}22`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px 0 20px',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          backgroundColor: bgColor,
        }}
      />
      <span
        style={{
          fontSize: '15px',
          fontWeight: 500,
          color: '#333',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {ingredient.name}
      </span>
      <button
        onClick={() => onRemove(ingredient.id)}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s ease, transform 0.2s ease',
          color: '#666',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#FF6B6B';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.6)';
          e.currentTarget.style.color = '#666';
        }}
      >
        ×
      </button>
    </div>
  );
});

IngredientCard.displayName = 'IngredientCard';

export default IngredientCard;
