import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getDailyGoal, updateDailyGoal, getRecipes, toggleFavorite as apiToggleFavorite } from '../api/recipeApi';
import { DailyGoal, Recipe } from '../types';
import RecipeCard from '../components/RecipeCard';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { dailyGoal, setDailyGoal, recipes, setRecipes, toggleRecipeFavorite } = useStore();
  const [formData, setFormData] = useState<DailyGoal>(dailyGoal);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const goal = await getDailyGoal();
        setDailyGoal(goal);
        setFormData(goal);
      } catch (error) {
        console.error('Failed to load daily goal:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadFavorites = async () => {
      setLoadingFavorites(true);
      try {
        const data = await getRecipes({ favorite: true });
        setFavoriteRecipes(data);
        setRecipes(data);
      } catch (error) {
        console.error('Failed to load favorite recipes:', error);
      } finally {
        setLoadingFavorites(false);
      }
    };
    loadFavorites();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: parseInt(value, 10) || 0 });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateDailyGoal(formData);
      setDailyGoal(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save daily goal:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await apiToggleFavorite(id);
      toggleRecipeFavorite(id);
      setFavoriteRecipes(favoriteRecipes.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleCardClick = (id: string) => {
    navigate(`/recipes/${id}/edit`);
  };

  return (
    <div className="profile-page">
      <div className="content-panel profile-goal-section">
        <h1 className="profile-section-title">每日营养目标</h1>
        <div className="profile-goal-form">
          <div className="profile-goal-item">
            <label htmlFor="calories">卡路里 (kcal)</label>
            <input
              id="calories"
              name="calories"
              type="number"
              min="0"
              value={formData.calories}
              onChange={handleInputChange}
              className="profile-goal-input"
            />
          </div>
          <div className="profile-goal-item">
            <label htmlFor="protein">蛋白质 (g)</label>
            <input
              id="protein"
              name="protein"
              type="number"
              min="0"
              value={formData.protein}
              onChange={handleInputChange}
              className="profile-goal-input"
            />
          </div>
          <div className="profile-goal-item">
            <label htmlFor="fat">脂肪 (g)</label>
            <input
              id="fat"
              name="fat"
              type="number"
              min="0"
              value={formData.fat}
              onChange={handleInputChange}
              className="profile-goal-input"
            />
          </div>
          <div className="profile-goal-item">
            <label htmlFor="carbs">碳水化合物 (g)</label>
            <input
              id="carbs"
              name="carbs"
              type="number"
              min="0"
              value={formData.carbs}
              onChange={handleInputChange}
              className="profile-goal-input"
            />
          </div>
        </div>
        <div className="profile-goal-actions">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : saved ? '✓ 已保存' : '保存目标'}
          </button>
        </div>
      </div>

      <div className="content-panel profile-favorites-section">
        <h2 className="profile-section-title">我的收藏</h2>
        {loadingFavorites ? (
          <div className="recipe-list-loading">
            <div className="spinner" />
            <span>加载中...</span>
          </div>
        ) : favoriteRecipes.length === 0 ? (
          <div className="recipe-list-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <h3>暂无收藏</h3>
            <p>去食谱列表收藏你喜欢的食谱吧</p>
          </div>
        ) : (
          <div className="recipe-grid">
            {favoriteRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onToggleFavorite={handleToggleFavorite}
                onClick={handleCardClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
