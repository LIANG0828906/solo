import React, { useState } from 'react';
import { X, Heart, Star, ChefHat, Clock, Flame, ListChecks, MessageSquare, Trash2 } from 'lucide-react';
import { Recipe } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { ingredients, cookingMethods, seasonings } from '@/data/ingredients';
import { calculateNutrition } from '@/utils/nutrition';
import './RecipeDetail.css';

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onClose }) => {
  const { toggleFavorite, favorites, rateRecipe, myRecipeIds, deleteRecipe } = useAppStore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const isFavorite = favorites.includes(recipe.id);
  const isMyRecipe = myRecipeIds.includes(recipe.id);

  const cookingMethod = cookingMethods.find((m) => m.id === recipe.cookingMethod);
  const nutritionInfo = calculateNutrition(recipe.mainIngredients, recipe.seasonings);

  const handleRate = () => {
    if (rating > 0) {
      rateRecipe(recipe.id, rating, comment);
      setRating(0);
      setComment('');
    }
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这个配方吗？')) {
      deleteRecipe(recipe.id);
      onClose();
    }
  };

  const renderDifficulty = () => {
    return Array.from({ length: 3 }, (_, i) => (
      <span key={i} className={`chili ${i < recipe.difficulty ? 'active' : ''}`}>
        🌶️
      </span>
    ));
  };

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div
        className="recipe-detail slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="detail-header">
          <div className="detail-image">
            <div className="detail-collage">
              {recipe.mainIngredients.slice(0, 4).map((ri, idx) => {
                const ing = ingredients.find((i) => i.id === ri.ingredientId);
                return (
                  <div
                    key={ri.ingredientId}
                    className="collage-big"
                    style={{
                      backgroundColor: ing?.color || '#eee',
                      left: `${15 + (idx % 2) * 40}%`,
                      top: `${20 + Math.floor(idx / 2) * 40}%`,
                    }}
                  >
                    <span>{ing?.icon || '🍽️'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="detail-info">
            <div className="detail-tags">
              <span className="tag">
                {cookingMethod?.icon} {cookingMethod?.name}
              </span>
              <span className="tag">
                <ChefHat size={14} /> {recipe.author}
              </span>
              {recipe.cuisine && <span className="tag">🍴 {recipe.cuisine}</span>}
            </div>

            <h1 className="detail-title">{recipe.name}</h1>
            <p className="detail-desc">{recipe.description}</p>

            <div className="detail-meta">
              <div className="meta-item">
                <Star size={18} fill="#FFD700" color="#FFD700" />
                <span className="meta-value">{recipe.rating}</span>
                <span className="meta-label">({recipe.ratingCount} 评价)</span>
              </div>
              <div className="meta-item difficulty-badge">
                {renderDifficulty()}
              </div>
              <div className="meta-item">
                <Clock size={18} />
                <span className="meta-value">{cookingMethod?.duration}</span>
              </div>
              <div className="meta-item">
                <Flame size={18} />
                <span className="meta-value">{nutritionInfo.calories} kcal</span>
              </div>
            </div>

            <div className="detail-actions">
              <button
                className={`action-btn favorite ${isFavorite ? 'active' : ''}`}
                onClick={() => toggleFavorite(recipe.id)}
              >
                <Heart size={20} fill={isFavorite ? '#FF4757' : 'none'} />
                {isFavorite ? '已收藏' : '收藏'}
              </button>
              {isMyRecipe && (
                <button className="action-btn delete" onClick={handleDelete}>
                  <Trash2 size={20} />
                  删除
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-section">
            <h3>
              <ListChecks size={20} />
              主要食材
            </h3>
            <div className="ingredients-list">
              {recipe.mainIngredients.map((ri) => {
                const ing = ingredients.find((i) => i.id === ri.ingredientId);
                return (
                  <div key={ri.ingredientId} className="ingredient-row">
                    <div className="ingredient-info">
                      <div
                        className="ingredient-dot"
                        style={{ backgroundColor: ing?.color }}
                      >
                        <span>{ing?.icon}</span>
                      </div>
                      <span className="ingredient-name">{ing?.name}</span>
                    </div>
                    <span className="ingredient-amount">{ri.amount}g</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="detail-section">
            <h3>
              🧂 调料
            </h3>
            <div className="seasonings-list">
              {recipe.seasonings.map((rs) => {
                const s = seasonings.find((s) => s.id === rs.seasoningId);
                return (
                  <div key={rs.seasoningId} className="seasoning-row">
                    <span className="seasoning-name">
                      {s?.icon} {s?.name}
                    </span>
                    <span className="seasoning-amount">{rs.amount}g</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="detail-section">
            <h3>
              📝 烹饪步骤
            </h3>
            <div className="steps-list">
              {recipe.steps.map((step, idx) => (
                <div key={idx} className="step-item">
                  <div className="step-number">{idx + 1}</div>
                  <p className="step-text">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h3>
              <MessageSquare size={20} />
              发表评价
            </h3>
            <div className="rating-section">
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="star-btn"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      size={28}
                      fill={star <= (hoverRating || rating) ? '#FFD700' : 'none'}
                      color={star <= (hoverRating || rating) ? '#FFD700' : '#ddd'}
                    />
                  </button>
                ))}
              </div>
              <textarea
                className="comment-input"
                placeholder="分享你的烹饪心得..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              <button
                className="submit-rating-btn"
                onClick={handleRate}
                disabled={rating === 0}
              >
                提交评价
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
