import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipeStore } from '@/store/recipeStore';
import { RecipeCard } from '@/components/recipeCard';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { filteredRecipes, loading, error, loadRecipes, searchRecipes, searchKeyword } =
    useRecipeStore();
  const [searchInput, setSearchInput] = useState(searchKeyword);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchRecipes(searchInput);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput, searchRecipes]);

  return (
    <div className="home-page">
      <nav className="navbar">
        <div className="nav-content">
          <h1 className="nav-title" onClick={() => navigate('/')}>
            巷陌食单
          </h1>
          <div className="nav-right">
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="搜索食谱..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
            <button className="create-btn" onClick={() => navigate('/create')}>
              + 发布新食谱
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {loading && filteredRecipes.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>加载中...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={() => loadRecipes()}>重试</button>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍳</div>
            <p className="empty-title">没有找到相关食谱</p>
            <p className="empty-subtitle">建议换个关键词试试</p>
          </div>
        ) : (
          <div className="recipe-grid">
            {filteredRecipes.map((recipe, index) => (
              <RecipeCard key={recipe.id} recipe={recipe} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
