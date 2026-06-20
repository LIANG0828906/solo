import React from 'react';
import { Recipe } from '../types';

interface DraggableRecipeProps {
  recipe: Recipe;
}

const DraggableRecipe: React.FC<DraggableRecipeProps> = ({ recipe }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('recipeId', recipe.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className="draggable-recipe"
      draggable
      onDragStart={handleDragStart}
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
