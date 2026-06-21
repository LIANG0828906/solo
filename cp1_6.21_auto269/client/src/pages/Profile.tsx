import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ChefHat, User } from 'lucide-react';
import Navbar from '../components/Navbar';
import RecipeCard from '../components/RecipeCard';
import { favoriteApi } from '../api';
import type { Recipe } from '../types';
import './Profile.css';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'favorites' | 'created'>('favorites');
  const [favorites, setFavorites] = React.useState<Recipe[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadFavorites = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await favoriteApi.getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('加载收藏失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === 'favorites') {
      loadFavorites();
    }
  }, [activeTab, loadFavorites]);

  const handleCardClick = (id: string) => {
    navigate(`/recipes/${id}`);
  };

  const handleFavoriteToggle = async (id: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await favoriteApi.addFavorite(id);
      } else {
        await favoriteApi.removeFavorite(id);
        setFavorites(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('收藏操作失败:', err);
    }
  };

  return (
    <div className="page-content">
      <Navbar />

      <div className="profile-container">
        <div className="profile-header animate-fade-in-up">
          <div className="profile-avatar">
            <User size={32} />
          </div>
          <div className="profile-info">
            <h1 className="profile-name">美食爱好者</h1>
            <p className="profile-desc">探索美食，享受烹饪的乐趣</p>
          </div>
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{favorites.length}</span>
              <span className="stat-label">收藏</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">创建</span>
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart size={18} />
            <span>我的收藏</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'created' ? 'active' : ''}`}
            onClick={() => setActiveTab('created')}
          >
            <ChefHat size={18} />
            <span>我创建的</span>
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'favorites' && (
            <>
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>加载中...</p>
                </div>
              ) : favorites.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💝</div>
                  <p className="empty-title">还没有收藏的食谱</p>
                  <p className="empty-desc">浏览食谱，发现喜欢的美食吧</p>
                </div>
              ) : (
                <div className="recipe-grid">
                  {favorites.map((recipe, index) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      isFavorite={true}
                      onFavoriteToggle={handleFavoriteToggle}
                      onClick={() => handleCardClick(recipe.id)}
                      delay={index * 50}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'created' && (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p className="empty-title">还没有创建食谱</p>
              <p className="empty-desc">创建您的第一个食谱，分享美食心得</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 20 }}
                onClick={() => navigate('/create')}
              >
                创建食谱
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
