import { useState, useEffect } from 'react';
import type { Recipe, Ingredient, FeedbackType } from '../recipeEngine';
import FeedbackList, { FEEDBACK_META } from './FeedbackList';
import type { FeedbackRecord } from '../recipeEngine';
import { submitFeedback, getFeedbackHistory } from '../api';

interface RecipeCardProps {
  recipe: Recipe | null;
  isLoading: boolean;
  onFeedbackSubmitted: () => void;
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  staple: { label: '主粮', icon: '🌾' },
  meat: { label: '肉类', icon: '🍖' },
  vegetable: { label: '蔬菜', icon: '🥬' },
  supplement: { label: '补剂', icon: '💊' },
};

function ProgressRing({ percentage }: { percentage: number }) {
  const [displayedPercentage, setDisplayedPercentage] = useState(0);
  const size = 52;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayedPercentage / 100) * circumference;

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setDisplayedPercentage(percentage);
    });
    return () => cancelAnimationFrame(timer);
  }, [percentage]);

  return (
    <div className="progress-ring-container">
      <svg className="progress-ring" width={size} height={size}>
        <circle className="progress-ring-bg" cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className="progress-ring-fg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <span className="progress-ring-value">{displayedPercentage}%</span>
    </div>
  );
}

function IngredientItem({ ingredient }: { ingredient: Ingredient }) {
  const meta = CATEGORY_META[ingredient.category];
  return (
    <div className="ingredient-item">
      <span className="ingredient-icon" role="img" aria-label={meta.label}>
        {meta.icon}
      </span>
      <div className="ingredient-details">
        <div className="ingredient-name">{ingredient.name}</div>
        <div className="ingredient-grams">{ingredient.grams} 克</div>
      </div>
      <ProgressRing percentage={ingredient.percentage} />
    </div>
  );
}

function TrendBadge({ trend, trendPercentage }: { trend: 'up' | 'down' | 'stable'; trendPercentage?: number }) {
  if (trend === 'stable' || !trendPercentage) return null;

  return (
    <div className={`trend-badge ${trend}`}>
      {trend === 'up' ? '▲' : '▼'} {trendPercentage}%
    </div>
  );
}

export default function RecipeCard({ recipe, isLoading, onFeedbackSubmitted }: RecipeCardProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [cardKey, setCardKey] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const loadFeedbacks = async () => {
    try {
      const history = await getFeedbackHistory();
      setFeedbacks(history);
    } catch (error) {
      console.error('Failed to load feedbacks:', error);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  useEffect(() => {
    if (recipe) {
      setIsFading(true);
      const t = setTimeout(() => {
        setCardKey((k) => k + 1);
        setIsFading(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [recipe?.id]);

  const handleQuickFeedback = async (type: FeedbackType) => {
    if (!recipe) return;
    try {
      await submitFeedback({
        recipeId: recipe.id,
        type,
        timestamp: new Date().toISOString(),
      });
      await loadFeedbacks();
      onFeedbackSubmitted();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  if (!recipe && !isLoading) {
    return (
      <div>
        <div className="recipe-card">
          <h2 className="recipe-title">今日配方</h2>
          <div className="empty-state">
            <div className="empty-state-icon">🐾</div>
            <div className="empty-state-text">填写左侧宠物信息，生成专属营养配餐</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={`recipe-card-wrapper ${isFading ? 'fade-out' : 'fade-in'}`}>
        <div key={cardKey} className={`recipe-card ${isLoading ? 'loading' : ''}`}>
          <div className={isLoading ? 'recipe-loading-content' : ''}>
            <TrendBadge trend={recipe?.trend ?? 'stable'} trendPercentage={recipe?.trendPercentage} />
            <h2 className="recipe-title">今日营养配餐</h2>

            <div className="recipe-total">
              <span className="recipe-total-value">{recipe?.totalGrams.toFixed(0)}</span>
              <span className="recipe-total-unit">克 / 餐</span>
            </div>

            {recipe && (
              <div className="ingredients-grid">
                {recipe.ingredients.map((ing) => (
                  <IngredientItem key={ing.category} ingredient={ing} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {recipe && (
        <div className="feedback-section">
          <div className="feedback-header">
            <h2 className="feedback-title" style={{ marginBottom: 0 }}>
              喂食反馈
            </h2>
          </div>

          <div className="feedback-quick-section">
            <div className="feedback-quick-title">快速记录这次喂食：</div>
            <div className="feedback-quick-buttons">
              {(Object.keys(FEEDBACK_META) as FeedbackType[]).map((type) => {
                const meta = FEEDBACK_META[type];
                return (
                  <button key={type} className="feedback-btn" onClick={() => handleQuickFeedback(type)}>
                    <span className="feedback-btn-emoji">{meta.emoji}</span>
                    <span className="feedback-btn-label">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <FeedbackList feedbacks={feedbacks} onFeedbackUpdated={loadFeedbacks} />
          </div>
        </div>
      )}
    </div>
  );
}
