import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Recipe } from '../types';
import { useDragDrop } from '../contexts/DragDropContext';

interface DraggableRecipeProps {
  recipe: Recipe;
}

const DraggableRecipe: React.FC<DraggableRecipeProps> = ({ recipe }) => {
  const { startDrag, updateDragPosition, endDrag, isDragging, draggedRecipe, dragPosition } = useDragDrop();
  const elementRef = useRef<HTMLDivElement>(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const hasMoved = useRef(false);

  const isThisDragging = isDragging && draggedRecipe?.id === recipe.id;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('recipeId', recipe.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      touchStartPos.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      hasMoved.current = false;

      longPressTimer.current = window.setTimeout(() => {
        if (!hasMoved.current && touchStartPos.current) {
          setIsTouchDragging(true);
          startDrag(recipe, touchStartPos.current.x, touchStartPos.current.y);
        }
      }, 200);
    },
    [recipe, startDrag]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      
      if (touchStartPos.current && !isTouchDragging) {
        const dx = Math.abs(touch.clientX - touchStartPos.current.x);
        const dy = Math.abs(touch.clientY - touchStartPos.current.y);
        
        if (dx > 10 || dy > 10) {
          hasMoved.current = true;
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          
          setIsTouchDragging(true);
          startDrag(recipe, touch.clientX, touch.clientY);
        }
      }
      
      if (isTouchDragging) {
        e.preventDefault();
        updateDragPosition(touch.clientX, touch.clientY);
      }
    },
    [isTouchDragging, recipe, startDrag, updateDragPosition]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      if (isTouchDragging) {
        const touch = e.changedTouches[0];
        endDrag(touch.clientX, touch.clientY);
        setIsTouchDragging(false);
      }
      
      touchStartPos.current = null;
      hasMoved.current = false;
    },
    [isTouchDragging, endDrag]
  );

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isTouchDragging) {
      endDrag(dragPosition.x, dragPosition.y);
      setIsTouchDragging(false);
    }
    touchStartPos.current = null;
    hasMoved.current = false;
  }, [isTouchDragging, endDrag]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className={`draggable-recipe${isThisDragging ? ' dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <div className="draggable-recipe-image-wrapper">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.title} className="draggable-recipe-image" />
        ) : (
          <div className="draggable-recipe-placeholder" />
        )}
      </div>
      <div className="draggable-recipe-title">{recipe.title}</div>
    </div>
  );
};

export default DraggableRecipe;
