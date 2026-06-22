import React, { useMemo } from 'react';
import { usePaletteStore } from '../store/paletteStore';
import RecipeCard from './RecipeCard';

const RecipeList: React.FC = () => {
  const recipes = usePaletteStore((state) => state.recipes);
  const searchKeyword = usePaletteStore((state) => state.searchKeyword);
  const setSearchKeyword = usePaletteStore((state) => state.searchRecipes);

  const filteredRecipes = useMemo(() => {
    if (!searchKeyword.trim()) return recipes;
    const kw = searchKeyword.toLowerCase();
    return recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(kw) ||
        r.baseColor.name.toLowerCase().includes(kw) ||
        r.addColors.some((ac) => ac.color.name.toLowerCase().includes(kw))
    );
  }, [recipes, searchKeyword]);

  const favoriteRecipes = filteredRecipes.filter((r) => r.isFavorite);
  const normalRecipes = filteredRecipes.filter((r) => !r.isFavorite);

  return (
    <div>
      <h2 className="panel-title">我的配方</h2>
      <div className="search-container">
        <svg
          className="search-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="搜索配方名称或颜色..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        {searchKeyword && (
          <button
            className="search-clear-btn"
            onClick={() => setSearchKeyword('')}
          >
            ×
          </button>
        )}
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎨</div>
          <div className="empty-state-text">
            {searchKeyword ? '没有找到匹配的配方' : '暂无配方，快去调色并保存吧！'}
          </div>
        </div>
      ) : (
        <div className="recipe-grid">
          {favoriteRecipes.length > 0 &&
            favoriteRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          {favoriteRecipes.length > 0 && normalRecipes.length > 0 && (
            <div className="favorite-divider" />
          )}
          {normalRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeList;
