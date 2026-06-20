import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recipe, fetchRecipeById } from '../api';
import { useAuth } from '../store/AuthContext';
import RecipeCard from '../components/RecipeCard';

export default function FavoritesPage() {
  const { user, isFavorite } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.favorites.length > 0) {
      loadFavorites();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const recipePromises = user.favorites.map(id =>
        fetchRecipeById(id).catch(() => null)
      );
      const results = await Promise.all(recipePromises);
      setRecipes(results.filter((r): r is Recipe => r !== null));
    } catch (error) {
      console.error('加载收藏失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteChange = () => {
    if (user) {
      loadFavorites();
    }
  };

  if (!user) {
    return (
      <div className="container main-content">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p className="empty-state-text">请先登录</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container main-content">
      <div className="page-header" style={{ marginTop: '40px' }}>
        <h1 className="page-title">我的收藏</h1>
        <span style={{ color: 'var(--color-text-light)' }}>
          共 {recipes.length} 个收藏
        </span>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>加载中...</span>
        </div>
      ) : recipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">❤️</div>
          <p className="empty-state-text">还没有收藏任何菜谱</p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '24px' }}>
            去发现美味的菜谱并收藏它们吧~
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            浏览菜谱
          </button>
        </div>
      ) : (
        <div className="recipe-grid" style={{ paddingBottom: '40px' }}>
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
