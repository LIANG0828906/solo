import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { likeRecipe } from '../api';

interface RecipeCardProps {
  recipe: Recipe;
}

const cuisineTagMap: Record<string, string> = {
  '中餐': 'cuisine-tag-chinese',
  '西餐': 'cuisine-tag-western',
  '日料': 'cuisine-tag-japanese',
  '烘焙': 'cuisine-tag-baking',
  '其他': 'cuisine-tag-other',
};

function getCuisineTagClass(tag: string): string {
  return cuisineTagMap[tag] || 'cuisine-tag-other';
}

function splitSteps(steps: string): string[] {
  return steps
    .split(/\d+\./)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likes, setLikes] = useState(recipe.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
    }
  };

  const handleLike = async () => {
    if (isLiking || isLiked) return;

    setIsLiking(true);
    try {
      const updated = await likeRecipe(recipe.id);
      setLikes(updated.likes);
      setIsLiked(true);
    } catch (err) {
      console.error('收藏失败:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const stepsList = splitSteps(recipe.steps);

  return (
    <>
      <div className="recipe-card" onClick={handleCardClick}>
        <img className="recipe-card-image" src={recipe.imageUrl} alt={recipe.name} />
        <div className="recipe-card-content">
          <div className="recipe-card-name">{recipe.name}</div>
          <div className="recipe-card-bottom">
            <span className="recipe-card-author">{recipe.author}</span>
            <span className="recipe-card-likes">
              <span className="recipe-card-heart">{isLiked ? '❤️' : '♥'}</span>
              {likes}
            </span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>
              ✕
            </button>
            <img className="modal-cover-image" src={recipe.imageUrl} alt={recipe.name} />
            <div className="modal-body">
              <h1 className="modal-title">{recipe.name}</h1>
              <div className="modal-meta">
                <span className="modal-author">作者：{recipe.author}</span>
                <span className="modal-likes">
                  <span className={`heart-icon ${isLiked ? 'filled' : ''}`}>
                    {isLiked ? '❤️' : '♥'}
                  </span>
                  {likes}
                </span>
              </div>

              <div className="cuisine-tags">
                {recipe.cuisineTags.map((tag, index) => (
                  <span key={index} className={`cuisine-tag ${getCuisineTagClass(tag)}`}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className="ingredients-section">
                <div className="section-title">食材</div>
                <div className="ingredients-text">{recipe.ingredients.join('，')}</div>
              </div>

              <div className="steps-section">
                <div className="section-title">制作步骤</div>
                <ol className="steps-list">
                  {stepsList.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              <button
                className={`recipe-like-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
                disabled={isLiking || isLiked}
              >
                <span className={`heart-icon ${isLiked ? 'filled' : ''}`}>
                  {isLiked ? '❤️' : '♥'}
                </span>
                {isLiked ? '已收藏' : isLiking ? '收藏中...' : '收藏'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecipeCard;
