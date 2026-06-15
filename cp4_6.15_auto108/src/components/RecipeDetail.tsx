import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRecipeStore } from '../store/recipeStore';
import type { NutritionInfo } from '../types';

export default function RecipeDetail() {
  const activeRecipe = useRecipeStore((s) => s.activeRecipe);
  const currentServings = useRecipeStore((s) => s.currentServings);
  const completedSteps = useRecipeStore((s) => s.completedSteps);
  const setActiveRecipe = useRecipeStore((s) => s.setActiveRecipe);
  const setCurrentServings = useRecipeStore((s) => s.setCurrentServings);
  const toggleStep = useRecipeStore((s) => s.toggleStep);

  const [closing, setClosing] = useState(false);
  const [flippingKey, setFlippingKey] = useState(0);
  const prevNutritionRef = useRef<NutritionInfo | null>(null);

  const scaleFactor = activeRecipe
    ? currentServings / activeRecipe.baseServings
    : 1;

  const nutrition: NutritionInfo = useMemo(() => {
    if (!activeRecipe) return { calories: 0, protein: 0, fat: 0, carbs: 0 };
    return activeRecipe.ingredients.reduce(
      (acc, ing) => {
        const scaled = ing.amount * scaleFactor;
        return {
          calories: acc.calories + scaled * ing.calories,
          protein: acc.protein + scaled * ing.protein,
          fat: acc.fat + scaled * ing.fat,
          carbs: acc.carbs + scaled * ing.carbs,
        };
      },
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );
  }, [activeRecipe, scaleFactor]);

  useEffect(() => {
    if (prevNutritionRef.current) {
      const prev = prevNutritionRef.current;
      if (
        Math.abs(prev.calories - nutrition.calories) > 0.5 ||
        Math.abs(prev.protein - nutrition.protein) > 0.5 ||
        Math.abs(prev.fat - nutrition.fat) > 0.5 ||
        Math.abs(prev.carbs - nutrition.carbs) > 0.5
      ) {
        setFlippingKey((k) => k + 1);
      }
    }
    prevNutritionRef.current = nutrition;
  }, [nutrition]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setActiveRecipe(null);
      setClosing(false);
    }, 300);
  }, [setActiveRecipe]);

  if (!activeRecipe) return null;

  const completedCount = completedSteps.length;
  const totalSteps = activeRecipe.steps.length;
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  const difficultyLabel =
    activeRecipe.difficulty === 'easy'
      ? '简单'
      : activeRecipe.difficulty === 'medium'
        ? '中等'
        : '困难';

  return (
    <div
      className={`detail-overlay ${closing ? 'closing' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={`detail-panel ${closing ? 'closing' : ''}`}>
        <div className="detail-header">
          <button className="detail-close" onClick={handleClose} aria-label="关闭">
            <i className="fa-solid fa-xmark" />
          </button>
          <h2 className="detail-name">{activeRecipe.name}</h2>
          <div className="detail-meta">
            <span>
              <i className="fa-regular fa-clock" style={{ marginRight: 4 }} />
              {activeRecipe.cookTime}分钟
            </span>
            <span>
              <i className="fa-solid fa-gauge" style={{ marginRight: 4 }} />
              {difficultyLabel}
            </span>
            <span>
              <i className="fa-solid fa-users" style={{ marginRight: 4 }} />
              {activeRecipe.baseServings}人份基准
            </span>
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-left">
            <h3 className="detail-section-title">
              <i className="fa-solid fa-sliders" />
              食材与份量
            </h3>

            <div className="servings-control">
              <span className="servings-label">份量</span>
              <input
                type="range"
                className="servings-slider"
                min={1}
                max={8}
                step={1}
                value={currentServings}
                onChange={(e) => setCurrentServings(Number(e.target.value))}
              />
              <span className="servings-value">{currentServings}</span>
              <span className="servings-unit">人份</span>
            </div>

            <div className="ingredient-list">
              {activeRecipe.ingredients.map((ing) => {
                const scaledAmount = Math.round(ing.amount * scaleFactor);
                return (
                  <div key={ing.id} className="ingredient-item">
                    <span className="ingredient-name">{ing.name}</span>
                    <span className="ingredient-amount">
                      {scaledAmount}{ing.unit}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="nutrition-panel">
              <h4 className="detail-section-title" style={{ marginBottom: 12 }}>
                <i className="fa-solid fa-fire-flame-curved" />
                营养信息
              </h4>
              <div className="nutrition-grid">
                <div className="nutrition-item">
                  <div className="nutrition-item-label">热量</div>
                  <span
                    key={`cal-${flippingKey}`}
                    className={`nutrition-item-value ${flippingKey > 0 ? 'flipping' : ''}`}
                  >
                    {Math.round(nutrition.calories)}
                  </span>
                  <span className="nutrition-item-unit">kcal</span>
                </div>
                <div className="nutrition-item">
                  <div className="nutrition-item-label">蛋白质</div>
                  <span
                    key={`pro-${flippingKey}`}
                    className={`nutrition-item-value ${flippingKey > 0 ? 'flipping' : ''}`}
                  >
                    {nutrition.protein.toFixed(1)}
                  </span>
                  <span className="nutrition-item-unit">g</span>
                </div>
                <div className="nutrition-item">
                  <div className="nutrition-item-label">脂肪</div>
                  <span
                    key={`fat-${flippingKey}`}
                    className={`nutrition-item-value ${flippingKey > 0 ? 'flipping' : ''}`}
                  >
                    {nutrition.fat.toFixed(1)}
                  </span>
                  <span className="nutrition-item-unit">g</span>
                </div>
                <div className="nutrition-item">
                  <div className="nutrition-item-label">碳水</div>
                  <span
                    key={`carb-${flippingKey}`}
                    className={`nutrition-item-value ${flippingKey > 0 ? 'flipping' : ''}`}
                  >
                    {nutrition.carbs.toFixed(1)}
                  </span>
                  <span className="nutrition-item-unit">g</span>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-right">
            <h3 className="detail-section-title">
              <i className="fa-solid fa-list-check" />
              烹饪步骤
            </h3>

            <div className="step-list">
              {activeRecipe.steps.map((step) => {
                const isCompleted = completedSteps.includes(step.id);
                return (
                  <div
                    key={step.id}
                    className={`step-item ${isCompleted ? 'completed' : ''}`}
                    onClick={() => toggleStep(step.id)}
                  >
                    <span className="step-number">
                      {isCompleted ? (
                        <i className="fa-solid fa-check" />
                      ) : (
                        step.order
                      )}
                    </span>
                    <span className="step-text">{step.description}</span>
                    <span className="step-check">
                      <i className="fa-solid fa-check" />
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="step-progress">
              已完成 {completedCount}/{totalSteps} 步
              <div className="step-progress-bar">
                <div
                  className="step-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
