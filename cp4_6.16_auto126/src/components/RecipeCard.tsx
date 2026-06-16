import React, { useState } from 'react';
import { Star, Heart, Eye } from 'lucide-react';
import { Recipe } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { ingredients, cookingMethods } from '@/data/ingredients';
import './RecipeCard.css';

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, style }) => {
  const { toggleFavorite, favorites } = useAppStore();
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const isFavorite = favorites.includes(recipe.id);

  const mainIngredientsData = recipe.mainIngredients
    .slice(0, 4)
    .map((ri) => ingredients.find((i) => i.id === ri.ingredientId))
    .filter(Boolean);

  const cookingMethod = cookingMethods.find((m) => m.id === recipe.cookingMethod);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLikeAnimating(true);
    toggleFavorite(recipe.id);
    setTimeout(() => setIsLikeAnimating(false), 600);
  };

  const renderDifficulty = () => {
    return Array.from({ length: 3 }, (_, i) => (
      <span
        key={i}
        className={`chili ${i < recipe.difficulty ? 'active' : ''}`}
      >
        🌶️
      </span>
    ));
  };

  const renderSparkles = () => {
    if (!isLikeAnimating) return null;
    
    const sparkles = Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 30 + Math.random() * 20;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const size = 6 + Math.random() * 6;
      const delay = Math.random() * 0.1;
      
      return (
        <span
          key={i}
          className="sparkle"
          style={{
            '--tx': `${tx}px`,
            '--ty': `${ty}px`,
            width: `${size}px`,
            height: `${size}px`,
            animationDelay: `${delay}s`,
          } as React.CSSProperties}
        />
      );
    });
    
    return <div className="sparkle-container">{sparkles}</div>;
  };

  return (
    <div
      className="recipe-card fade-in"
      onClick={onClick}
      style={style}
    >
      <div className="card-image">
        <div className="ingredient-collage">
          {mainIngredientsData.map((ing, idx) => (
            <div
              key={ing?.id || idx}
              className="collage-item"
              style={{
                backgroundColor: ing?.color || '#eee',
                left: `${10 + (idx % 2) * 45}%`,
                top: `${15 + Math.floor(idx / 2) * 35}%`,
              }}
            >
              <span className="collage-icon">{ing?.icon || '🍽️'}</span>
            </div>
          ))}
        </div>
        
        <div className="card-badge">
          {cookingMethod?.icon} {cookingMethod?.name}
        </div>

        <button
          className={`favorite-btn ${isFavorite ? 'active' : ''} ${isLikeAnimating ? 'animating' : ''}`}
          onClick={handleFavoriteClick}
        >
          <Heart size={20} fill={isFavorite ? '#FF4757' : 'none'} />
          {renderSparkles()}
        </button>
      </div>

      <div className="card-content">
        <h3 className="recipe-title">{recipe.name}</h3>
        <p className="recipe-desc">{recipe.description}</p>
        
        <div className="card-meta">
          <div className="difficulty">
            {renderDifficulty()}
          </div>
          <div className="rating">
            <Star size={16} fill="#FFD700" color="#FFD700" />
            <span>{recipe.rating}</span>
            <span className="rating-count">({recipe.ratingCount})</span>
          </div>
        </div>

        <div className="card-footer">
          <span className="author">👨‍🍳 {recipe.author}</span>
          <button className="preview-btn" onClick={onClick}>
            <Eye size={16} />
            <span>查看</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
