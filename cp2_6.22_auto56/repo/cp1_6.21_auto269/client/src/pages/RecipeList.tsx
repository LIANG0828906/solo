import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter } from 'lucide-react';
import Navbar from '../components/Navbar';
import FilterPanel from '../components/FilterPanel';
import RecipeCard from '../components/RecipeCard';
import { recipeApi, favoriteApi } from '../api';
import type { Recipe, CookTimeRange } from '../types';

const RecipeList: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [cookTimeRange, setCookTimeRange] = React.useState<CookTimeRange>('');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [favoriteIds, setFavoriteIds] = React.useState<Set<string>>(new Set());

  const loadRecipes = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        tags?: string;
        cookTimeRange?: CookTimeRange;
      } = {};
      if (selectedTags.length > 0) {
        params.tags = selectedTags.join(',');
      }
      if (cookTimeRange) {
        params.cookTimeRange = cookTimeRange;
      }
      const data = await recipeApi.getRecipes(params);
      setRecipes(data);
    } catch (err) {
      console.error('加载食谱失败:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTags, cookTimeRange]);

  const loadFavorites = React.useCallback(async () => {
    try {
      const data = await favoriteApi.getFavorites();
      setFavoriteIds(new Set(data.map(r => r.id)));
    } catch (err) {
      console.error('加载收藏失败:', err);
    }
  }, []);

  React.useEffect(() => {
    loadRecipes();
    loadFavorites();
  }, [loadRecipes, loadFavorites]);

  const handleCardClick = (id: string) => {
    navigate(`/recipes/${id}`);
  };

  const handleFavoriteToggle = async (id: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await favoriteApi.addFavorite(id);
        setFavoriteIds(prev => new Set(prev).add(id));
      } else {
        await favoriteApi.removeFavorite(id);
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (err) {
      console.error('收藏操作失败:', err);
    }
  };

  return (
    <div className="page-content">
      <Navbar />

      <div className="main-container">
        <FilterPanel
          selectedTags={selectedTags}
          cookTimeRange={cookTimeRange}
          onTagsChange={setSelectedTags}
          onCookTimeChange={setCookTimeRange}
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
        />

        <div className="content-area">
          <div className="page-header">
            <h1 className="page-title">发现美食</h1>
            <p className="page-subtitle">探索精选食谱，开启您的烹饪之旅</p>
          </div>

          <button
            className="mobile-filter-btn"
            onClick={() => setFilterOpen(true)}
          >
            <Filter size={16} />
            <span>筛选</span>
            {(selectedTags.length > 0 || cookTimeRange) && (
              <span className="filter-count">
                {selectedTags.length + (cookTimeRange ? 1 : 0)}
              </span>
            )}
          </button>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>加载中...</p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍳</div>
              <p className="empty-title">暂无食谱</p>
              <p className="empty-desc">调整筛选条件或创建第一个食谱吧</p>
            </div>
          ) : (
            <div className="recipe-grid">
              {recipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  isFavorite={favoriteIds.has(recipe.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                  onClick={() => handleCardClick(recipe.id)}
                  delay={index * 50}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeList;
