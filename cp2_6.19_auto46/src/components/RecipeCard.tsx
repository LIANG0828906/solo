import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipeStore, type Recipe } from '../store/recipeStore';

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, index }) => {
  const navigate = useNavigate();
  const { isDragging, dragRecipeId, setDragging, flyingRecipeId } = useRecipeStore();

  const handleClick = (_e: React.MouseEvent) => {
    if (isDragging) return;
    navigate(`/recipe/${recipe.id}`);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setDragging(true, recipe.id);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', recipe.id);
  };

  const handleDragEnd = () => {
    setDragging(false, null);
  };

  const isBeingDragged = dragRecipeId === recipe.id;
  const isFlying = flyingRecipeId === recipe.id;

  const getAspectRatio = () => {
    const hash = recipe.id.split('-').reduce((acc, val) => acc + val.charCodeAt(0), 0);
    const ratios = [1.33, 1.0, 1.5, 0.8, 1.2];
    return ratios[hash % ratios.length];
  };

  const aspectRatio = getAspectRatio();

  const renderStars = (rating: number) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`recipe-card ${isBeingDragged ? 'dragging' : ''} ${isFlying ? 'flying' : ''}`}
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={handleClick}
      draggable
      onDragStart={(e) => handleDragStart(e)}
      onDragEnd={handleDragEnd}
    >
      <div className="card-image" style={{ aspectRatio: aspectRatio }}>
        <img
          src={recipe.coverImage}
          alt={recipe.title}
          loading="lazy"
        />
        <div className="card-favorite">
          <span className="heart">♥</span>
          <span>{recipe.favorites}</span>
        </div>
      </div>
      <div className="card-content">
        <h3 className="card-title">{recipe.title}</h3>
        <div className="card-footer">
          <div className="author">
            <img src={recipe.author.avatar} alt={recipe.author.name} />
            <span>{recipe.author.name}</span>
          </div>
          <div className="rating">
            {renderStars(recipe.averageRating)}
            <span className="rating-text">{recipe.averageRating}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
