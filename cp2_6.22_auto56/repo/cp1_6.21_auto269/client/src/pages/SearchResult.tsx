import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import Navbar from '../components/Navbar';
import FilterPanel from '../components/FilterPanel';
import RecipeCard from '../components/RecipeCard';
import { recipeApi, favoriteApi } from '../api';
import type { Recipe, CookTimeRange } from '../types';

const SearchResult: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [cookTimeRange, setCookTimeRange] = React.useState<CookTimeRange>('');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [favoriteIds, setFavoriteIds] = React.useState<Set<string>>(new Set());
  const [searchValue, setSearchValue] = React.useState(query);

  const loadRecipes = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        search?: string;
        tags?: string;
        cookTimeRange?: CookTimeRange;
      } = {};
      if (query) {
        params.search = query;
      }
      if (selectedTags.length > 0) {
        params.tags = selectedTags.join(',');
      }
      if (cookTimeRange) {
        params.cookTimeRange = cookTimeRange;
      }
      const data = await recipeApi.getRecipes(params);
      setRecipes(data);
    } catch (err) {
      console.error('搜索失败:', err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedTags, cookTimeRange]);

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

  const handleSearch = (keyword: string) => {
    setSearchValue(keyword);
    setSearchParams({ q: keyword });
  };

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
      <Navbar onSearch={handleSearch} searchValue={searchValue} />

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
            <h1 className="page-title">
              <Search size={24} style={{ marginRight: 8 }} />
              搜索结果
            </h1>
            <p className="page-subtitle">
              {query ? `"${query}" 找到 ${recipes.length} 个食谱` : '请输入关键词搜索'}
            </p>
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
              <p>搜索中...</p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p className="empty-title">没有找到相关食谱</p>
              <p className="empty-desc">试试其他关键词或调整筛选条件</p>
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

export default SearchResult;
