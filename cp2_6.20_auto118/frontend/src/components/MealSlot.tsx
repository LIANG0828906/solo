import React, { useState } from 'react';
import { Recipe } from '../types';

type MealType = 'breakfast' | 'lunch' | 'dinner';

interface MealSlotProps {
  date: string;
  mealType: MealType;
  recipe?: Recipe;
  onDrop: (date: string, mealType: MealType, recipeId: string) => void;
  onRemove: (date: string, mealType: MealType) => void;
}

const mealTypeLabels: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
};

const MealSlot: React.FC<MealSlotProps> = ({ date, mealType, recipe, onDrop, onRemove }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const recipeId = e.dataTransfer.getData('recipeId');
    if (recipeId) {
      onDrop(date, mealType, recipeId);
    }
  };

  return (
    <div
      className={`meal-slot${isOver ? ' meal-slot-over' : ''}${recipe ? ' meal-slot-filled' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="meal-slot-type">{mealTypeLabels[mealType]}</div>
      {recipe ? (
        <div className="meal-slot-recipe">
          <div className="meal-slot-recipe-info">
            {recipe.imageUrl && (
              <img src={recipe.imageUrl} alt={recipe.title} className="meal-slot-recipe-image" />
            )}
            <span className="meal-slot-recipe-title">{recipe.title}</span>
          </div>
          <button
            className="meal-slot-remove"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(date, mealType);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="meal-slot-placeholder">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>拖拽食谱到此</span>
        </div>
      )}
    </div>
  );
};

export default MealSlot;
