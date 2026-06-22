import { useState, useEffect } from 'react';
import type { Recipe } from '../types';
import { useRecipeStore } from '../store/recipeStore';

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
}

const MAX_COOK_TIME = 90;
const RING_RADIUS = 21;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function RecipeCard({ recipe, index }: RecipeCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [ringAnimated, setRingAnimated] = useState(false);
  const setActiveRecipe = useRecipeStore((s) => s.setActiveRecipe);

  useEffect(() => {
    const timer = setTimeout(() => setRingAnimated(true), 300 + index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const timeProgress = Math.min(recipe.cookTime / MAX_COOK_TIME, 1);
  const ringOffset = ringAnimated
    ? RING_CIRCUMFERENCE * (1 - timeProgress)
    : RING_CIRCUMFERENCE;

  const gradientId = `timeGrad-${recipe.id}`;
  const difficultyLabel =
    recipe.difficulty === 'easy'
      ? '简单'
      : recipe.difficulty === 'medium'
        ? '中等'
        : '困难';
  const difficultyClass = `card-difficulty card-difficulty-${recipe.difficulty}`;

  return (
    <div
      className="recipe-card"
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => setActiveRecipe(recipe)}
    >
      <div className="card-image-wrap">
        <img
          className={`card-image ${imageLoaded ? 'loaded' : ''}`}
          src={recipe.imageUrl}
          alt={recipe.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
        <div className="card-time-ring">
          <svg viewBox="0 0 48 48">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4CAF50" />
                <stop offset="100%" stopColor="#E8A838" />
              </linearGradient>
            </defs>
            <circle
              className="card-time-ring-bg"
              cx="24"
              cy="24"
              r={RING_RADIUS}
            />
            <circle
              className="card-time-ring-progress"
              cx="24"
              cy="24"
              r={RING_RADIUS}
              stroke={`url(#${gradientId})`}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
            />
          </svg>
          <span className="card-time-ring-text">{recipe.cookTime}分</span>
        </div>
        <span className={difficultyClass}>{difficultyLabel}</span>
      </div>

      <div className="card-body">
        <h3 className="card-name">{recipe.name}</h3>
        <p className="card-desc">{recipe.description}</p>
        <div className="card-match">
          <span className="card-match-label">匹配度</span>
          <div className="card-match-bar">
            <div
              className="card-match-fill"
              style={{ width: `${recipe.matchScore}%` }}
            />
          </div>
          <span className="card-match-value">{recipe.matchScore}%</span>
        </div>
      </div>
    </div>
  );
}
