import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Clock, ChefHat, Clock3 } from 'lucide-react';
import Navbar from '../components/Navbar';
import ShareModal from '../components/ShareModal';
import { recipeApi, favoriteApi, shareApi } from '../api';
import type { Recipe, ShareInfo } from '../types';
import './RecipeDetail.css';

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = React.useState<Recipe | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [heartAnimating, setHeartAnimating] = React.useState(false);
  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const [shareInfo, setShareInfo] = React.useState<ShareInfo | null>(null);
  const [shareLoading, setShareLoading] = React.useState(false);

  const loadRecipe = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await recipeApi.getRecipe(id);
      setRecipe(data);
    } catch (err) {
      console.error('加载食谱详情失败:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const checkFavorite = React.useCallback(async () => {
    if (!id) return;
    try {
      const favorites = await favoriteApi.getFavorites();
      setIsFavorite(favorites.some(f => f.id === id));
    } catch (err) {
      console.error('检查收藏状态失败:', err);
    }
  }, [id]);

  React.useEffect(() => {
    loadRecipe();
    checkFavorite();
  }, [loadRecipe, checkFavorite]);

  const handleFavoriteToggle = async () => {
    if (!id) return;
    const newState = !isFavorite;
    setIsFavorite(newState);
    setHeartAnimating(true);
    setTimeout(() => setHeartAnimating(false), 300);

    try {
      if (newState) {
        await favoriteApi.addFavorite(id);
      } else {
        await favoriteApi.removeFavorite(id);
      }
    } catch (err) {
      console.error('收藏操作失败:', err);
      setIsFavorite(!newState);
    }
  };

  const handleShare = async () => {
    if (!id) return;
    setShareModalOpen(true);
    setShareLoading(true);
    try {
      const data = await shareApi.getShareInfo(id);
      setShareInfo(data);
    } catch (err) {
      console.error('生成分享信息失败:', err);
    } finally {
      setShareLoading(false);
    }
  };

  const formatCookTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
  };

  if (loading) {
    return (
      <div className="page-content">
        <Navbar />
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="page-content">
        <Navbar />
        <div className="empty-state">
          <div className="empty-icon">😕</div>
          <p className="empty-title">食谱不存在</p>
          <p className="empty-desc">该食谱可能已被删除</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <Navbar />

      <div className="detail-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>

        <div className="detail-header animate-fade-in-up">
          <div className="detail-cover">
            <img src={recipe.coverImage} alt={recipe.name} />
            <div className="detail-actions">
              <button
                className={`action-btn favorite-action ${isFavorite ? 'active' : ''} ${heartAnimating ? 'animating' : ''}`}
                onClick={handleFavoriteToggle}
              >
                <Heart size={22} fill={isFavorite ? 'currentColor' : 'none'} />
                <span>{isFavorite ? '已收藏' : '收藏'}</span>
              </button>
              <button className="action-btn share-action" onClick={handleShare}>
                <Share2 size={22} />
                <span>分享</span>
              </button>
            </div>
          </div>

          <div className="detail-info">
            <h1 className="detail-title">{recipe.name}</h1>

            <div className="detail-meta">
              <div className="meta-item">
              <Clock size={18} />
                <span>烹饪时间：{formatCookTime(recipe.cookTime)}</span>
              </div>
            </div>

            <div className="detail-tags">
              {recipe.tags.map(tag => (
                <span key={tag} className="detail-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="detail-sections">
          <section className="detail-section animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h2 className="section-title">
              <ChefHat size={22} />
              <span>食材清单</span>
            </h2>
            <div className="ingredients-list">
              {recipe.ingredients.map((ing, index) => (
                <div key={index} className="ingredient-item">
                  <span className="ingredient-name">{ing.name}</span>
                  <span className="ingredient-amount">{ing.amount}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="detail-section animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <h2 className="section-title">
              <Clock3 size={22} />
              <span>制作步骤</span>
            </h2>
            <div
              className="steps-content"
              dangerouslySetInnerHTML={{ __html: recipe.steps }}
            />
          </section>
        </div>
      </div>

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareInfo={shareInfo}
        loading={shareLoading}
      />
    </div>
  );
};

export default RecipeDetail;
