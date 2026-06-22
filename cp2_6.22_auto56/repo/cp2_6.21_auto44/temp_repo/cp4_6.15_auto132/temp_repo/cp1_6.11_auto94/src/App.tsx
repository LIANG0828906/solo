import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Recipe } from './types';
import RecipeCard from './components/RecipeCard';
import RecipeDetail from './components/RecipeDetail';

type View = 'list' | 'detail';

const App: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/recipes', { signal: controller.signal })
      .then((res) => res.json())
      .then((data: Recipe[]) => {
        setRecipes(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('加载食谱失败:', err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;

    const query = searchQuery.toLowerCase().trim();
    return recipes.filter((recipe) => {
      if (recipe.title.toLowerCase().includes(query)) return true;
      if (recipe.tags.some((tag) => tag.toLowerCase().includes(query))) return true;
      if (recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(query))) return true;
      return false;
    });
  }, [recipes, searchQuery]);

  const selectedRecipe = useMemo(() => {
    if (!selectedRecipeId) return null;
    return recipes.find((r) => r.id === selectedRecipeId) || null;
  }, [recipes, selectedRecipeId]);

  const handleCardClick = useCallback((id: string) => {
    setSelectedRecipeId(id);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = useCallback(() => {
    setView('list');
    setSelectedRecipeId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleTitleClick = useCallback(() => {
    setView('list');
    setSelectedRecipeId(null);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-title" onClick={handleTitleClick}>
          🍳 美味替换
        </div>
        <div className="navbar-center">
          <input
            type="text"
            className="search-box"
            placeholder="搜索菜名、食材、标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={view === 'detail'}
          />
          <button
            className="publish-btn"
            onClick={() => alert('发布食谱功能即将上线！敬请期待~')}
          >
            + 发布食谱
          </button>
        </div>
        <div className="auth-btns">
          <button
            className="auth-btn"
            onClick={() => alert('登录功能即将上线！')}
          >
            登录
          </button>
          <button
            className="auth-btn primary"
            onClick={() => alert('注册功能即将上线！')}
          >
            注册
          </button>
        </div>
      </nav>

      <div className="main-content">
        {view === 'list' && (
          <>
            <h1 className="page-title">发现美味，灵活替换</h1>
            <p className="page-subtitle">
              分享你的拿手好菜，缺少食材？智能推荐替你搞定！
            </p>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                正在加载美食盛宴...
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🍽️</div>
                <p className="empty-state-text">
                  {searchQuery
                    ? `没有找到包含"${searchQuery}"的食谱，换个关键词试试？`
                    : '暂时还没有食谱，快来发布你的第一道菜吧！'}
                </p>
              </div>
            ) : (
              <div className="waterfall">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => handleCardClick(recipe.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {view === 'detail' && selectedRecipe && (
          <RecipeDetail recipe={selectedRecipe} onBack={handleBack} />
        )}

        {view === 'detail' && !selectedRecipe && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon">❓</div>
            <p className="empty-state-text">食谱不存在或已被删除</p>
            <span
              className="back-link"
              onClick={handleBack}
              style={{ display: 'inline-block', marginTop: 20 }}
            >
              ← 返回食谱列表
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default App;
