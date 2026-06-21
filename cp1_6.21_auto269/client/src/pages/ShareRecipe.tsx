import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, ChefHat, Clock3, Share2 } from 'lucide-react';
import { shareApi } from '../api';
import type { Recipe } from '../types';
import './ShareRecipe.css';

const ShareRecipe: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = React.useState<Recipe | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadRecipe = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await shareApi.getSharedRecipe(id);
        setRecipe(data);
      } catch (err) {
        console.error('加载食谱失败:', err);
      } finally {
        setLoading(false);
      }
    };
    loadRecipe();
  }, [id]);

  const formatCookTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
  };

  if (loading) {
    return (
      <div className="share-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="share-page">
        <div className="empty-state">
          <div className="empty-icon">😕</div>
          <p className="empty-title">食谱不存在</p>
          <p className="empty-desc">该食谱可能已被删除或链接无效</p>
        </div>
      </div>
    );
  }

  return (
    <div className="share-page">
      <div className="share-header">
        <Link to="/" className="share-logo">
          <Share2 size={24} />
          <span>食谱管家</span>
        </Link>
      </div>

      <div className="share-container">
        <div className="share-recipe-card animate-fade-in-up">
          <div className="share-cover">
            <img src={recipe.coverImage} alt={recipe.name} />
          </div>

          <div className="share-content">
            <h1 className="share-title">{recipe.name}</h1>

            <div className="share-meta">
              <div className="meta-item">
                <Clock size={18} />
                <span>烹饪时间：{formatCookTime(recipe.cookTime)}</span>
              </div>
            </div>

            <div className="share-tags">
              {recipe.tags.map(tag => (
                <span key={tag} className="share-tag">
                  {tag}
                </span>
              ))}
            </div>

            <section className="share-section">
              <h2 className="share-section-title">
                <ChefHat size={20} />
                <span>食材清单</span>
              </h2>
              <div className="share-ingredients">
                {recipe.ingredients.map((ing, index) => (
                  <div key={index} className="share-ingredient">
                    <span className="share-ingredient-name">{ing.name}</span>
                    <span className="share-ingredient-amount">{ing.amount}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="share-section">
              <h2 className="share-section-title">
                <Clock3 size={20} />
                <span>制作步骤</span>
              </h2>
              <div
                className="share-steps"
                dangerouslySetInnerHTML={{ __html: recipe.steps }}
              />
            </section>
          </div>
        </div>

        <div className="share-footer animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <p>分享自 食谱管家</p>
          <Link to="/" className="btn btn-primary">
            打开食谱管家
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShareRecipe;
