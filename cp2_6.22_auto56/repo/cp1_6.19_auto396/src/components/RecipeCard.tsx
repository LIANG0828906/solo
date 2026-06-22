import React, { useEffect, useRef } from 'react';
import { Recipe } from '../types';
import { usePaletteStore } from '../store/paletteStore';
import { generateSmallTexture } from '../utils/colorMixer';

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadRecipe = usePaletteStore((state) => state.loadRecipe);
  const toggleFavorite = usePaletteStore((state) => state.toggleFavorite);
  const copyRecipeText = usePaletteStore((state) => state.copyRecipeText);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 30;
    canvas.height = 30;
    generateSmallTexture(canvas, recipe.mixedColor);
  }, [recipe.mixedColor]);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.favorite-btn')) return;
    copyRecipeText(recipe);
  };

  const handleDoubleClick = () => {
    loadRecipe(recipe);
  };

  return (
    <div
      className="recipe-card"
      onClick={handleCardClick}
      onDoubleClick={handleDoubleClick}
      title="单击复制配方，双击加载到工作台"
    >
      <div className="recipe-card-header">
        <canvas ref={canvasRef} className="recipe-preview-canvas" />
        <div className="recipe-card-info">
          <div className="recipe-card-name">{recipe.name}</div>
          <div className="recipe-card-base">基底：{recipe.baseColor.name}</div>
        </div>
        <button
          className={`favorite-btn ${recipe.isFavorite ? 'active' : 'inactive'}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(recipe.id);
          }}
        >
          {recipe.isFavorite ? '★' : '☆'}
        </button>
      </div>
    </div>
  );
};

export default RecipeCard;
