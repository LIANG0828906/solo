import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Check, Flame, ShoppingCart } from 'lucide-react';
import { useStore } from './store';
import { DIET_TAGS, getIngredientById } from './data';
import type { DietTag } from './data';

export default function RecommendationPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasComputed, setHasComputed] = useState(false);

  const userIngredients = useStore((s) => s.userIngredients);
  const dietPreferences = useStore((s) => s.dietPreferences);
  const recommendations = useStore((s) => s.recommendations);
  const selectedRecipeIds = useStore((s) => s.selectedRecipeIds);
  const toggleDietPreference = useStore((s) => s.toggleDietPreference);
  const computeRecommendations = useStore((s) => s.computeRecommendations);
  const toggleRecipeSelection = useStore((s) => s.toggleRecipeSelection);

  useEffect(() => {
    computeRecommendations();
    setHasComputed(true);
  }, [userIngredients, dietPreferences, computeRecommendations]);

  const handleToggleExpand = useCallback((recipeId: string) => {
    setExpandedId((prev) => (prev === recipeId ? null : recipeId));
  }, []);

  const hasIngredients = userIngredients.length > 0;

  return (
    <div className="recommendation-page">
      <div className="page-header">
        <h1 className="page-title">食谱推荐</h1>
        <p className="page-subtitle">根据你的食材和偏好智能推荐</p>
      </div>

      <div className="diet-preferences">
        <h3 className="section-title">饮食偏好</h3>
        <div className="tag-list">
          {DIET_TAGS.map((tag) => (
            <button
              key={tag}
              className={`diet-tag ${dietPreferences.includes(tag as DietTag) ? 'diet-tag-active' : ''}`}
              onClick={() => toggleDietPreference(tag as DietTag)}
            >
              {dietPreferences.includes(tag as DietTag) && (
                <Check size={12} />
              )}
              {tag}
            </button>
          ))}
        </div>
      </div>

      {!hasIngredients ? (
        <div className="empty-state">
          <div className="empty-icon">🍳</div>
          <p>请先添加食材</p>
          <p className="empty-hint">在食材管理页添加冰箱里的食材</p>
        </div>
      ) : hasComputed && recommendations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🤔</div>
          <p>暂无匹配食谱</p>
          <p className="empty-hint">试试添加更多食材或调整饮食偏好</p>
        </div>
      ) : (
        <div className="recommendation-list">
          {recommendations.map((rs, index) => {
            const isExpanded = expandedId === rs.recipe.id;
            const isSelected = selectedRecipeIds.includes(rs.recipe.id);
            return (
              <div
                key={rs.recipe.id}
                className={`recipe-card ${isSelected ? 'recipe-card-selected' : ''}`}
              >
                <div
                  className="recipe-card-header"
                  onClick={() => handleToggleExpand(rs.recipe.id)}
                >
                  <div className="recipe-card-left">
                    <div className="recipe-rank">#{index + 1}</div>
                    <div className="recipe-card-info">
                      <h3 className="recipe-name">{rs.recipe.name}</h3>
                      <div className="recipe-meta">
                        <span className="recipe-calories">
                          <Flame size={12} />
                          {rs.recipe.calories} kcal
                        </span>
                        <span className="recipe-match">
                          匹配度 {Math.round(rs.matchRate * 100)}%
                        </span>
                      </div>
                      <div className="recipe-tags">
                        {rs.recipe.tags.map((tag) => (
                          <span key={tag} className="recipe-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="recipe-card-right">
                    <div className="score-badge">
                      {Math.round(rs.score * 100)}
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={18} className="expand-icon" />
                    ) : (
                      <ChevronDown size={18} className="expand-icon" />
                    )}
                  </div>
                </div>

                <div
                  className={`recipe-detail ${isExpanded ? 'recipe-detail-expanded' : ''}`}
                >
                  {isExpanded && (
                    <div className="recipe-detail-content">
                      <div className="detail-section">
                        <h4>烹饪步骤</h4>
                        <ol className="steps-list">
                          {rs.recipe.steps.map((step, i) => (
                            <li key={i} className="step-item">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {rs.missingIngredients.length > 0 && (
                        <div className="detail-section">
                          <h4 className="missing-title">
                            <ShoppingCart size={14} />
                            需要补购的食材
                          </h4>
                          <div className="missing-list">
                            {rs.missingIngredients.map((mi) => {
                              const ing = getIngredientById(mi.ingredientId);
                              return (
                                <span key={mi.ingredientId} className="missing-item">
                                  {ing?.name} {mi.quantity}{mi.unit}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="detail-section">
                        <h4>全部食材</h4>
                        <div className="all-ingredients-list">
                          {rs.recipe.ingredients.map((ri) => {
                            const ing = getIngredientById(ri.ingredientId);
                            const hasIt = userIngredients.some(
                              (ui) => ui.ingredientId === ri.ingredientId
                            );
                            return (
                              <span
                                key={ri.ingredientId}
                                className={`all-ingredient-item ${hasIt ? 'has-ingredient' : 'missing-ingredient'}`}
                              >
                                {ing?.name} {ri.quantity}{ri.unit}
                                {ri.required ? '' : '(可选)'}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        className={`select-recipe-btn ${isSelected ? 'deselect-btn' : ''}`}
                        onClick={() => toggleRecipeSelection(rs.recipe.id)}
                      >
                        {isSelected ? '取消选择' : '加入购物清单'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedRecipeIds.length > 0 && (
        <div className="selection-summary">
          已选择 <strong>{selectedRecipeIds.length}</strong> 个食谱，前往购物清单查看
        </div>
      )}
    </div>
  );
}
