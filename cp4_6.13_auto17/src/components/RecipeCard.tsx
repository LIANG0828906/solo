import { useState, memo } from 'react';
import { Clock, ChefHat, Check, X, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import type { MatchedRecipe } from '../types';
import './RecipeCard.css';

interface RecipeCardProps {
  recipe: MatchedRecipe;
  onDragStart?: (e: React.DragEvent, recipe: MatchedRecipe) => void;
  draggable?: boolean;
}

const difficultyColors: Record<string, string> = {
  '简单': 'difficulty-easy',
  '中等': 'difficulty-medium',
  '困难': 'difficulty-hard',
};

const matchCategoryColors: Record<string, string> = {
  '完全匹配': 'match-perfect',
  '缺少1-2样': 'match-partial',
  '缺少更多': 'match-low',
};

function RecipeCardComponent({ recipe, onDragStart, draggable = false }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, recipe);
    }
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className={`recipe-card ${matchCategoryColors[recipe.matchCategory]}`}
      draggable={draggable}
      onDragStart={handleDragStart}
    >
      <div className="recipe-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="recipe-card-title-row">
          {draggable && (
            <GripVertical className="drag-handle" size={16} />
          )}
          <h3 className="recipe-name">{recipe.name}</h3>
          <span className={`match-badge ${matchCategoryColors[recipe.matchCategory]}`}>
            {recipe.matchCategory}
          </span>
        </div>
        <div className="recipe-meta">
          <span className="meta-item">
            <Clock size={14} />
            {recipe.cookTime}分钟
          </span>
          <span className={`meta-item difficulty ${difficultyColors[recipe.difficulty]}`}>
            <ChefHat size={14} />
            {recipe.difficulty}
          </span>
        </div>
      </div>

      <div className="recipe-ingredients">
        <div className="ingredients-label">所需食材</div>
        <ul className="ingredients-list">
          {recipe.ingredients.map((ing, idx) => {
            const isMatched = recipe.matchedIngredients.includes(ing.name);
            return (
              <li key={idx} className={`ingredient-item ${isMatched ? 'matched' : 'missing'}`}>
                {isMatched ? (
                  <Check size={14} className="icon-check" />
                ) : (
                  <X size={14} className="icon-x" />
                )}
                <span className="ingredient-name">{ing.name}</span>
                <span className="ingredient-amount">{ing.quantity}{ing.unit}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="recipe-expand-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? (
          <><ChevronUp size={16} /> 收起详情</>
        ) : (
          <><ChevronDown size={16} /> 查看做法</>
        )}
      </div>

      {expanded && (
        <div className="recipe-steps">
          <div className="steps-label">烹饪步骤</div>
          <ol className="steps-list">
            {recipe.steps.map((step, idx) => (
              <li key={idx} className="step-item">
                <span className="step-number">{idx + 1}</span>
                <span className="step-text">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export const RecipeCard = memo(RecipeCardComponent);
