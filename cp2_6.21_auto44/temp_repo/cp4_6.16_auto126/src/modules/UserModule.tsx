import React, { useMemo } from 'react';
import { BookOpen, Heart, Star, Trash2, ChefHat } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import RecipeCard from '@/components/RecipeCard';
import RecipeDetail from '@/components/RecipeDetail';
import { ViewMode } from '@/types';
import './UserModule.css';

interface UserModuleProps {
  mode: ViewMode;
}

const UserModule: React.FC<UserModuleProps> = ({ mode }) => {
  const {
    recipes,
    favorites,
    myRecipeIds,
    selectedRecipeId,
    setSelectedRecipeId,
    setIsCreateModalOpen,
    deleteRecipe,
  } = useAppStore();

  const displayRecipes = useMemo(() => {
    if (mode === 'favorites') {
      return recipes.filter((r) => favorites.includes(r.id));
    } else if (mode === 'my-recipes') {
      return recipes.filter((r) => myRecipeIds.includes(r.id));
    }
    return [];
  }, [recipes, favorites, myRecipeIds, mode]);

  const selectedRecipe = useMemo(() => {
    if (!selectedRecipeId) return null;
    return recipes.find((r) => r.id === selectedRecipeId) || null;
  }, [selectedRecipeId, recipes]);

  const stats = useMemo(() => {
    const myRecipesList = recipes.filter((r) => myRecipeIds.includes(r.id));
    const totalRating = myRecipesList.reduce((sum, r) => sum + r.rating * r.ratingCount, 0);
    const totalReviews = myRecipesList.reduce((sum, r) => sum + r.ratingCount, 0);
    const avgRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : '0';

    return {
      myRecipesCount: myRecipeIds.length,
      favoritesCount: favorites.length,
      avgRating,
      totalReviews,
    };
  }, [recipes, myRecipeIds, favorites]);

  const getTitle = () => {
    return mode === 'favorites' ? '我的收藏' : '我的配方';
  };

  const getEmptyMessage = () => {
    if (mode === 'favorites') {
      return '你还没有收藏任何菜谱，快去发现美食吧';
    }
    return '你还没有创建任何配方，点击下方按钮开始创作';
  };

  return (
    <div className="user-module fade-in">
      <div className="user-header">
        <div className="user-profile">
          <div className="avatar">
            <ChefHat size={32} />
          </div>
          <div className="user-info">
            <h2 className="user-name">美食小达人</h2>
            <p className="user-title">创意厨师</p>
          </div>
        </div>

        <div className="user-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.myRecipesCount}</span>
            <span className="stat-label">
              <BookOpen size={14} /> 自创菜谱
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.favoritesCount}</span>
            <span className="stat-label">
              <Heart size={14} /> 收藏
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.avgRating}</span>
            <span className="stat-label">
              <Star size={14} /> 平均评分
            </span>
          </div>
        </div>
      </div>

      <div className="content-section">
        <div className="section-header">
          <h3>{getTitle()}</h3>
          {mode === 'my-recipes' && (
            <button
              className="create-recipe-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + 创建新配方
            </button>
          )}
        </div>

        {displayRecipes.length > 0 ? (
          <div className="recipe-list">
            {displayRecipes.map((recipe, index) => (
              <div key={recipe.id} className="recipe-item">
                <RecipeCard
                  recipe={recipe}
                  onClick={() => setSelectedRecipeId(recipe.id)}
                  style={{ animationDelay: `${index * 0.05}s` }}
                />
                {mode === 'my-recipes' && (
                  <button
                    className="delete-recipe-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('确定要删除这个配方吗？')) {
                        deleteRecipe(recipe.id);
                      }
                    }}
                  >
                    <Trash2 size={16} />
                    删除
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-section">
            <div className="empty-emoji">
              {mode === 'favorites' ? '💔' : '📝'}
            </div>
            <h4>暂无内容</h4>
            <p>{getEmptyMessage()}</p>
          </div>
        )}
      </div>

      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipeId(null)}
        />
      )}
    </div>
  );
};

export default UserModule;
