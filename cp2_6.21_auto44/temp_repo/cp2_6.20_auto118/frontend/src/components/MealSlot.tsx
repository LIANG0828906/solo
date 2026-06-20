import React, { useState, useRef, useEffect } from 'react';
import { Recipe } from '../types';
import { useDragDrop } from '../contexts/DragDropContext';

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
  const slotRef = useRef<HTMLDivElement>(null);
  const { overSlotKey, draggedRecipe, registerSlot, unregisterSlot, isDragging } = useDragDrop();
  
  const slotKey = `${date}-${mealType}`;
  const isTouchOver = overSlotKey === slotKey;
  const showDropPlaceholder = (isOver || isTouchOver) && draggedRecipe;

  useEffect(() => {
    if (slotRef.current) {
      registerSlot(slotKey, slotRef.current, date, mealType);
    }
    return () => {
      unregisterSlot(slotKey);
    };
  }, [slotKey, date, mealType, registerSlot, unregisterSlot]);

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
      ref={slotRef}
      className={`meal-slot${isOver || isTouchOver ? ' meal-slot-over' : ''}${recipe ? ' meal-slot-filled' : ''}`}
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
      {showDropPlaceholder && (
        <div className="meal-slot-drop-placeholder">
          <div className="meal-slot-drop-recipe-name">{draggedRecipe?.title}</div>
        </div>
      )}
    </div>
  );
};

export default MealSlot;
