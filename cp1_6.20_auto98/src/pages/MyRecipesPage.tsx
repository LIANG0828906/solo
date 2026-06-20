import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recipe, fetchUserRecipes } from '../api';
import { useAuth } from '../store/AuthContext';
import RecipeCard from '../components/RecipeCard';

export default function MyRecipesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecipes();
    }
  }, [user]);

  const loadRecipes = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchUserRecipes(user.id);
      setRecipes(data);
    } catch (error) {
      console.error('加载菜谱失败:', error);
    } finally {
      setLoading(false);
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
        <h1 className="page-title">我的菜谱</h1>
        <button className="btn btn-primary" onClick={() => navigate('/create-recipe')}>
          + 创建菜谱
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>加载中...</span>
        </div>
      ) : recipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p className="empty-state-text">还没有创建菜谱</p>
          <button className="btn btn-primary" onClick={() => navigate('/create-recipe')}>
            创建第一个菜谱
          </button>
        </div>
      ) : (
        <div className="recipe-grid" style={{ paddingBottom: '40px' }}>
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
