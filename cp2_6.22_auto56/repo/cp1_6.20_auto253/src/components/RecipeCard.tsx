import React from 'react';
import { RecipeSummary } from '../types';

interface RecipeCardProps {
  recipe: RecipeSummary;
  selectedIngredients: string[];
  onTry: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, selectedIngredients, onTry }) => {
  const isIngredientAvailable = (id: string) => selectedIngredients.includes(id);

  const renderDifficulty = () => {
    const flames = [];
    for (let i = 1; i <= 3; i++) {
      flames.push(
        <span 
          key={i} 
          className={`flame-icon ${i <= recipe.difficulty ? 'active' : ''}`}
        >
          🔥
        </span>
      );
    }
    return flames;
  };

  return (
    <div className="recipe-card">
      <div className="recipe-header">
        <h3 className="recipe-name">{recipe.name}</h3>
        <span className="recipe-match-score">{recipe.matchScore}%</span>
      </div>
      
      <div className="recipe-ingredients-list">
        {recipe.ingredients.map(ing => (
          <div 
            key={ing.id} 
            className={`ingredient-tag ${isIngredientAvailable(ing.id) ? 'available' : 'missing'}`}
          >
            <span className="status-dot">
              {isIngredientAvailable(ing.id) ? '✓' : '?'}
            </span>
            <span>{ing.name}</span>
            {!ing.required && <span style={{ color: '#9e9e9e', fontSize: '11px' }}>(选)</span>}
          </div>
        ))}
      </div>
      
      <div className="recipe-info">
        <div className="info-item">
          <span className="info-icon">⏱️</span>
          <span>{recipe.cookTime}分钟</span>
        </div>
        <div className="info-item">
          <span className="info-icon">🔥</span>
          <span>{recipe.calories}千卡</span>
        </div>
        <div className="info-item">
          <div className="difficulty-stars">
            {renderDifficulty()}
          </div>
        </div>
      </div>
      
      <button className="try-btn" onClick={onTry}>
        🍳 尝试这道菜
      </button>
    </div>
  );
};

export default RecipeCard;
