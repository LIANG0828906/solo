import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Filter, TrendingUp, Clock, ChefHat } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { RecommendEngine } from '@/engine/RecommendEngine';
import RecipeCard from '@/components/RecipeCard';
import RecipeDetail from '@/components/RecipeDetail';
import SearchBar from '@/components/SearchBar';
import CreateRecipeModal from '@/components/CreateRecipeModal';
import { Recipe } from '@/types';
import { ingredients } from '@/data/ingredients';
import './RecipeModule.css';

const RecipeModule: React.FC = () => {
  const {
    recipes,
    viewMode,
    searchQuery,
    selectedIngredients,
    selectedRecipeId,
    setSelectedRecipeId,
    setIsCreateModalOpen,
    getFilteredRecipes,
    isLoading,
    favorites,
  } = useAppStore();

  const [sortBy, setSortBy] = useState<'recommend' | 'rating' | 'newest'>('recommend');

  const recommendEngine = useMemo(() => {
    return new RecommendEngine(recipes);
  }, [recipes]);

  const displayedRecipes = useMemo(() => {
    const filtered = getFilteredRecipes();

    if (sortBy === 'recommend') {
      return recommendEngine.getRecommendations({
        favoriteIds: favorites,
        selectedIngredients,
        searchQuery: '',
        maxResults: 50,
      });
    } else if (sortBy === 'rating') {
      return [...filtered].sort((a, b) => b.rating - a.rating);
    } else {
      return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
    }
  }, [recipes, searchQuery, selectedIngredients, sortBy, viewMode, favorites, recommendEngine, getFilteredRecipes]);

  const selectedRecipe = useMemo(() => {
    if (!selectedRecipeId) return null;
    return recipes.find((r) => r.id === selectedRecipeId) || null;
  }, [selectedRecipeId, recipes]);

  const getViewTitle = () => {
    switch (viewMode) {
      case 'favorites':
        return '我的收藏';
      case 'my-recipes':
        return '我的配方';
      default:
        return '发现美食';
    }
  };

  const getViewSubtitle = () => {
    switch (viewMode) {
      case 'favorites':
        return `共 ${displayedRecipes.length} 道收藏的菜谱`;
      case 'my-recipes':
        return `共 ${displayedRecipes.length} 道自创菜谱`;
      default:
        return '探索创意菜谱，发现美食灵感';
    }
  };

  if (isLoading) {
    return (
      <div className="recipe-module-loading">
        <div className="loading-spinner">🍳</div>
        <p>正在加载美味菜谱...</p>
      </div>
    );
  }

  return (
    <div className="recipe-module fade-in">
      <div className="module-header">
        <div className="header-left">
          <h2 className="view-title">{getViewTitle()}</h2>
          <p className="view-subtitle">{getViewSubtitle()}</p>
        </div>
        <button
          className="create-btn"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={20} />
          创建配方
        </button>
      </div>

      <div className="search-section">
        <SearchBar />
      </div>

      <div className="filter-bar">
        <div className="sort-options">
          <span className="filter-label">
            <Filter size={16} /> 排序方式
          </span>
          <button
            className={`sort-btn ${sortBy === 'recommend' ? 'active' : ''}`}
            onClick={() => setSortBy('recommend')}
          >
            <TrendingUp size={16} />
            智能推荐
          </button>
          <button
            className={`sort-btn ${sortBy === 'rating' ? 'active' : ''}`}
            onClick={() => setSortBy('rating')}
          >
            ⭐ 评分最高
          </button>
          <button
            className={`sort-btn ${sortBy === 'newest' ? 'active' : ''}`}
            onClick={() => setSortBy('newest')}
          >
            <Clock size={16} />
            最新发布
          </button>
        </div>

        <div className="quick-filters">
          <span className="filter-label">热门食材：</span>
          {ingredients.slice(0, 6).map((ing) => (
            <button
              key={ing.id}
              className={`ingredient-chip ${
                selectedIngredients.includes(ing.id) ? 'active' : ''
              }`}
              onClick={() =>
                useAppStore.getState().toggleIngredientFilter(ing.id)
              }
            >
              {ing.icon} {ing.name}
            </button>
          ))}
        </div>
      </div>

      <div className="recipe-grid">
        {displayedRecipes.length > 0 ? (
          displayedRecipes.map((recipe: Recipe, index: number) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => setSelectedRecipeId(recipe.id)}
              style={{ animationDelay: `${index * 0.05}s` }}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <h3>还没有菜谱</h3>
            <p>
              {viewMode === 'favorites'
                ? '快去收藏一些喜欢的菜谱吧'
                : viewMode === 'my-recipes'
                ? '点击上方按钮创建你的第一个配方'
                : '没有找到匹配的菜谱，试试其他关键词'}
            </p>
          </div>
        )}
      </div>

      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipeId(null)}
        />
      )}

      <CreateRecipeModal />
    </div>
  );
};

export default RecipeModule;
