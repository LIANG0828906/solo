import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getRecipes, toggleFavorite as apiToggleFavorite } from '../api/recipeApi';
import RecipeCard from '../components/RecipeCard';
import RecipeFilter, { FilterOptions } from '../components/RecipeFilter';

const RecipeList: React.FC = () => {
  const navigate = useNavigate();
  const { recipes, setRecipes, toggleRecipeFavorite } = useStore();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    cuisine: 'all',
    cookTime: 'all',
    difficulty: 'all',
    search: '',
  });

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const params: {
        cuisine?: string;
        maxCookTime?: number;
        difficulty?: number;
        search?: string;
      } = {};
      if (filters.cuisine !== 'all') params.cuisine = filters.cuisine;
      if (filters.cookTime !== 'all') {
        if (filters.cookTime === '60+') {
          params.maxCookTime = 9999;
        } else {
          params.maxCookTime = parseInt(filters.cookTime, 10);
        }
      }
      if (filters.difficulty !== 'all') params.difficulty = parseInt(filters.difficulty, 10);
      if (filters.search) params.search = filters.search;

      const data = await getRecipes(params);
      setRecipes(data);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes();
  }, [filters]);

  const handleToggleFavorite = async (id: string) => {
    try {
      await apiToggleFavorite(id);
      toggleRecipeFavorite(id);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleCardClick = (id: string) => {
    navigate(`/recipes/${id}/edit`);
  };

  return (
    <div className="recipe-list-page">
      <div className="content-panel">
        <div className="recipe-list-header">
          <h1 className="recipe-list-title">食谱列表</h1>
        </div>
        <RecipeFilter filters={filters} onChange={setFilters} />
        {loading ? (
          <div className="recipe-list-loading">
            <div className="spinner" />
            <span>加载中...</span>
          </div>
        ) : recipes.length === 0 ? (
          <div className="recipe-list-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <h3>暂无食谱</h3>
            <p>试试调整筛选条件或添加新食谱</p>
          </div>
        ) : (
          <div className="recipe-grid">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onToggleFavorite={handleToggleFavorite}
                onClick={handleCardClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeList;
