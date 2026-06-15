import { memo } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import type { MatchedRecipe, Ingredient, Recipe } from '../types';
import { RecipeCard } from './RecipeCard';
import { useRecipeMatcher } from '../hooks/useRecipeMatcher';
import './RecipeGrid.css';

interface RecipeGridProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  onDragStart?: (e: React.DragEvent, recipe: MatchedRecipe) => void;
  onRefresh?: () => void;
}

function RecipeGridComponent({ recipes, ingredients, onDragStart, onRefresh }: RecipeGridProps) {
  const { perfectMatches, partialMatches, lowMatches } = useRecipeMatcher(recipes, ingredients);

  return (
    <div className="recipe-grid-container">
      <div className="recipe-grid-header">
        <div className="header-title">
          <Sparkles className="header-icon" size={24} />
          <h2>智能菜谱推荐</h2>
          <button className="refresh-btn" onClick={onRefresh} title="刷新推荐">
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="match-stats">
          <span className="stat-item perfect">
            <span className="stat-count">{perfectMatches.length}</span>
            <span className="stat-label">完全匹配</span>
          </span>
          <span className="stat-item partial">
            <span className="stat-count">{partialMatches.length}</span>
            <span className="stat-label">缺少1-2样</span>
          </span>
          <span className="stat-item low">
            <span className="stat-count">{lowMatches.length}</span>
            <span className="stat-label">缺少更多</span>
          </span>
        </div>
      </div>

      <div className="recipe-sections">
        {perfectMatches.length > 0 && (
          <section className="recipe-section">
            <div className="section-header">
              <h3 className="section-title perfect">
                <span className="title-dot"></span>
                完全匹配
              </h3>
              <span className="section-count">{perfectMatches.length} 道菜谱</span>
            </div>
            <div className="recipe-cards-grid">
              {perfectMatches.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  draggable={true}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
          </section>
        )}

        {partialMatches.length > 0 && (
          <section className="recipe-section">
            <div className="section-header">
              <h3 className="section-title partial">
                <span className="title-dot"></span>
                缺少1-2样食材
              </h3>
              <span className="section-count">{partialMatches.length} 道菜谱</span>
            </div>
            <div className="recipe-cards-grid">
              {partialMatches.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  draggable={true}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
          </section>
        )}

        {lowMatches.length > 0 && (
          <section className="recipe-section">
            <div className="section-header">
              <h3 className="section-title low">
                <span className="title-dot"></span>
                缺少更多食材
              </h3>
              <span className="section-count">{lowMatches.length} 道菜谱</span>
            </div>
            <div className="recipe-cards-grid">
              {lowMatches.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  draggable={true}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
          </section>
        )}

        {recipes.length === 0 && (
          <div className="empty-recipe-state">
            <p>暂无菜谱数据</p>
          </div>
        )}
      </div>
    </div>
  );
}

export const RecipeGrid = memo(RecipeGridComponent);
