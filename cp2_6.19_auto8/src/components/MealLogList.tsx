import { useState, useCallback } from 'react';
import type { MealEntry } from '../types';
import { getMealTypeLabel, getMealTypeIcon } from '../utils/calculateNutrients';

interface MealLogListProps {
  meals: MealEntry[];
  onDeleteMeal: (mealId: string) => void;
}

function MealLogList({ meals, onDeleteMeal }: MealLogListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCardClick = useCallback((mealId: string) => {
    setExpandedId(prev => prev === mealId ? null : mealId);
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent, mealId: string) => {
    e.stopPropagation();
    onDeleteMeal(mealId);
  }, [onDeleteMeal]);

  if (meals.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📝</div>
        <div className="empty-state-text">还没有饮食记录，快来添加吧！</div>
      </div>
    );
  }

  return (
    <div className="meal-logs">
      {meals.map(meal => (
        <div
          key={meal.id}
          className={`meal-card ${meal.isNew ? 'is-new' : ''}`}
          onClick={() => handleCardClick(meal.id)}
        >
          <div className="meal-card-header">
            <div className="meal-card-left">
              <div className="meal-icon">
                {getMealTypeIcon(meal.mealType)}
              </div>
              <div className="meal-info">
                <div className="meal-type">{getMealTypeLabel(meal.mealType)}</div>
                <div className="meal-name">{meal.foodName} · {meal.grams}g</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div>
                <span className="meal-calories">{Math.round(meal.calories)}</span>
                <span className="meal-calories-unit"> kcal</span>
              </div>
              <span 
                className={`expand-arrow ${expandedId === meal.id ? 'expanded' : ''}`}
              >
                ▼
              </span>
              <button
                className="delete-btn"
                onClick={(e) => handleDelete(e, meal.id)}
                title="删除记录"
              >
                ×
              </button>
            </div>
          </div>

          <div className={`meal-details ${expandedId === meal.id ? 'expanded' : ''}`}>
            <div className="nutrient-grid">
              <div className="nutrient-item">
                <div className="label">🔥 热量</div>
                <div className="value">{meal.calories.toFixed(1)}<span className="unit"> kcal</span></div>
              </div>
              <div className="nutrient-item">
                <div className="label">💪 蛋白质</div>
                <div className="value">{meal.protein.toFixed(1)}<span className="unit"> g</span></div>
              </div>
              <div className="nutrient-item">
                <div className="label">🥑 脂肪</div>
                <div className="value">{meal.fat.toFixed(1)}<span className="unit"> g</span></div>
              </div>
              <div className="nutrient-item">
                <div className="label">🍞 碳水</div>
                <div className="value">{meal.carbs.toFixed(1)}<span className="unit"> g</span></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MealLogList;
