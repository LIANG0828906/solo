import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, ChefHat } from 'lucide-react';
import useStore from '../store/useStore';
import RecipeCard from '../components/RecipeCard';
import './FavoritesPage.css';

function FavoritesPage() {
  const favorites = useStore(state => state.favorites);
  const recipes = useStore(state => state.recipes);

  const favoriteRecipes = useMemo(() => {
    return recipes.filter(r => favorites.includes(r.id));
  }, [recipes, favorites]);

  return (
    <div className="favorites-page">
      <div className="favorites-container">
        <div className="favorites-header">
          <Link to="/" className="fav-back-link">
            <ArrowLeft size={18} />
            返回首页
          </Link>

          <div className="favorites-title-wrap">
            <div className="fav-icon-badge">
              <Heart size={28} fill="#E74C3C" />
            </div>
            <div>
              <h1 className="favorites-title">我的收藏夹</h1>
              <p className="favorites-count">
                {favoriteRecipes.length > 0
                  ? `已收藏 ${favoriteRecipes.length} 道菜谱`
                  : '还没有收藏任何菜谱'}
              </p>
            </div>
          </div>
        </div>

        {favoriteRecipes.length === 0 ? (
          <div className="favorites-empty">
            <div className="empty-illustration">
              <span className="empty-emoji">🍽️</span>
              <div className="empty-decoration" />
            </div>
            <h2 className="empty-title">收藏夹空空如也</h2>
            <p className="empty-desc">
              去首页逛逛，发现喜欢的菜谱点击心形按钮收藏吧！
            </p>
            <Link to="/" className="empty-action-btn">
              <ChefHat size={18} />
              去发现菜谱
            </Link>
          </div>
        ) : (
          <div className="favorites-grid">
            {favoriteRecipes.map((recipe, index) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                lazy={index >= 8}
              />
            ))}
          </div>
        )}

        {favoriteRecipes.length > 0 && (
          <div className="favorites-tips">
            <Heart size={14} />
            <span>提示：点击卡片右上角的心形按钮可取消收藏</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default FavoritesPage;
