import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Recipe } from '../types';
import { useRecipeStore } from '../stores/recipeStore';

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
}

export function RecipeCard({ recipe, index }: RecipeCardProps) {
  const navigate = useNavigate();
  const { isRecipeSelected, addToShoppingList, removeFromShoppingList } = useRecipeStore();
  const [showCheckmark, setShowCheckmark] = useState(false);
  const isSelected = isRecipeSelected(recipe.id);

  const handleCardClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  const handleAddToList = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      removeFromShoppingList(recipe.id);
    } else {
      addToShoppingList(recipe.id);
      setShowCheckmark(true);
      setTimeout(() => setShowCheckmark(false), 1000);
    }
  };

  return (
    <div
      className="recipe-card"
      onClick={handleCardClick}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="recipe-card-image-wrapper">
        <img
          src={recipe.imageUrl}
          alt={recipe.name}
          className="recipe-card-image"
          loading="lazy"
        />
        <button
          className="recipe-card-button"
          onClick={handleAddToList}
        >
          {isSelected ? '✕ 移出清单' : '+ 加入购物清单'}
        </button>
        {showCheckmark && (
          <div className="recipe-card-checkmark">
            ✓
          </div>
        )}
      </div>
      <div className="recipe-card-content">
        <h3 className="recipe-card-title">{recipe.name}</h3>
        <p className="recipe-card-author">{recipe.author}</p>
      </div>
    </div>
  );
}
