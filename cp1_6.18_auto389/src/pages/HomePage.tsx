import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { useRecipeStore } from '@/store/recipeStore';
import { Recipe } from '@/types';

const PAGE_SIZE = 6;
const MAX_DISPLAY = 12;

const getDifficultyClass = (difficulty: string) => {
  const map: Record<string, string> = {
    简单: 'tag-difficulty-easy',
    中等: 'tag-difficulty-medium',
    困难: 'tag-difficulty-hard',
  };
  return map[difficulty] || '';
};

const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  return (
    <Link to={`/recipe/${recipe.id}`} className="card recipe-card">
      <div className="recipe-card-image">🍽️</div>
      <div className="recipe-card-body">
        <div className="recipe-card-title">{recipe.name}</div>
        <div className="recipe-card-meta">
          <span className="meta-item">⏱️ {recipe.duration}分钟</span>
          <span className={`tag ${getDifficultyClass(recipe.difficulty)}`}>
            {recipe.difficulty}
          </span>
        </div>
      </div>
    </Link>
  );
};

export const HomePage: React.FC = () => {
  const { recommendedRecipes, fetchRecipes } = useRecipeStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const filteredRecipes = useMemo(() => {
    if (!searchTerm.trim()) return recommendedRecipes;
    const term = searchTerm.toLowerCase();
    return recommendedRecipes.filter((r) => r.name.toLowerCase().includes(term));
  }, [recommendedRecipes, searchTerm]);

  const displayRecipes = useMemo(() => {
    const limited = filteredRecipes.slice(0, MAX_DISPLAY);
    const start = (currentPage - 1) * PAGE_SIZE;
    return limited.slice(start, start + PAGE_SIZE);
  }, [filteredRecipes, currentPage]);

  const totalPages = Math.ceil(Math.min(filteredRecipes.length, MAX_DISPLAY) / PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, recommendedRecipes]);

  return (
    <div className="container page-wrapper">
      <h1 className="page-title">🍳 智能食谱推荐</h1>
      <SearchBar recommendMode />
      <SearchBar onSearch={setSearchTerm} />

      {displayRecipes.length === 0 ? (
        <div className="empty-state">😕 没有找到相关食谱哦</div>
      ) : (
        <>
          <div className="recipe-grid">
            {displayRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
