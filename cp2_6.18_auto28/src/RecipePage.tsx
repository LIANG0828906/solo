import { useState, KeyboardEvent, useEffect, useRef } from 'react';
import { useAppStore } from './store';
import { MatchedRecipe } from './engine';

function getProgressClass(percentage: number): string {
  if (percentage >= 90) return 'progress-purple';
  if (percentage >= 70) return 'progress-blue';
  if (percentage >= 50) return 'progress-green';
  return 'progress-gray';
}

function RecipeCard({ recipe, animKey }: { recipe: MatchedRecipe; animKey: number }) {
  const { favoriteRecipes, saveRecipe, removeRecipe, setDetailRecipe } = useAppStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const frameRef = useRef<number | null>(null);
  const isFavorited = favoriteRecipes.includes(recipe.id);

  useEffect(() => {
    setDisplayProgress(0);
    const start = performance.now();
    const duration = 500;
    const target = recipe.matchPercentage;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setDisplayProgress(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [animKey, recipe.matchPercentage]);

  const handleFavoriteClick = () => {
    setIsAnimating(true);
    if (isFavorited) {
      removeRecipe(recipe.id);
    } else {
      saveRecipe(recipe.id);
    }
    setTimeout(() => setIsAnimating(false), 400);
  };

  return (
    <div className="recipe-card">
      <div className="card-header">
        <div className="recipe-name">{recipe.name}</div>
        <button
          className={`favorite-btn ${isAnimating ? 'active' : ''}`}
          onClick={handleFavoriteClick}
        >
          <span className={isFavorited ? 'heart-red' : 'heart-gray'}>❤</span>
        </button>
      </div>

      <div className="match-section">
        <div className="match-label">
          <span>匹配度</span>
          <span>{displayProgress}%</span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${getProgressClass(displayProgress)}`}
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>

      <div className="ingredients-list">
        {recipe.ingredients.map((ing, idx) => (
          <span key={idx} className="ingredient-chip">
            {ing}
          </span>
        ))}
      </div>

      <div className="rating-display">
        <span>评分：</span>
        <span className="rating-score">{recipe.averageRating > 0 ? `${recipe.averageRating} 分` : '暂无评分'}</span>
      </div>

      <div className="card-actions">
        <button className="detail-btn" onClick={() => setDetailRecipe(recipe)}>
          →
        </button>
      </div>
    </div>
  );
}

export default function RecipePage() {
  const { ingredients, addIngredient, removeIngredient, calculateRecommendations, recommendedRecipes } =
    useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [animKey, setAnimKey] = useState(0);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      addIngredient(inputValue.trim());
      setInputValue('');
    }
  };

  const handleRecommend = () => {
    calculateRecommendations();
    setAnimKey((k) => k + 1);
  };

  return (
    <div className="recipe-page">
      <aside className="ingredient-panel">
        <div className="panel-title">冰箱食材</div>
        <input
          className="ingredient-input"
          type="text"
          placeholder="例如输入鸡蛋、西红柿、洋葱，按回车添加"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div className="ingredient-tags">
          {ingredients.map((ing, idx) => (
            <span key={idx} className="ingredient-tag">
              {ing}
              <button className="tag-remove" onClick={() => removeIngredient(ing)}>
                ×
              </button>
            </span>
          ))}
        </div>

        <button
          className="recommend-btn"
          onClick={handleRecommend}
          disabled={ingredients.length === 0}
        >
          推荐菜谱
        </button>
      </aside>

      <main className="result-panel">
        {recommendedRecipes.length === 0 ? (
          <div className="result-empty">
            <div className="result-empty-icon">🍽️</div>
            <div className="result-empty-text">
              {ingredients.length === 0
                ? '请在左侧输入食材，然后点击推荐按钮'
                : '暂无匹配度超过50%的菜谱，试试添加更多食材吧'}
            </div>
          </div>
        ) : (
          <div className="recipe-list">
            {recommendedRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} animKey={animKey} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
