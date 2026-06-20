import React, { useState } from 'react';
import { Ingredient } from '../types';

interface IngredientCardProps {
  ingredient: Ingredient;
  onRemove: (id: string) => void;
}

const IngredientCard: React.FC<IngredientCardProps> = ({ ingredient, onRemove }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(ingredient.id);
    }, 300);
  };

  const gradientStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${ingredient.color}, ${ingredient.colorEnd})`
  };

  return (
    <div 
      className={`ingredient-card ${isRemoving ? 'removing' : ''}`}
      style={gradientStyle}
    >
      <button 
        className="remove-btn" 
        onClick={handleRemove}
        aria-label={`移除${ingredient.name}`}
      >
        ×
      </button>
      <span className="ingredient-card-emoji">{ingredient.emoji}</span>
      <span className="ingredient-card-name">{ingredient.name}</span>
    </div>
  );
};

export default IngredientCard;
