import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recipe } from '../api';
import { useAuth } from '../store/AuthContext';

interface RecipeCardProps {
  recipe: Recipe;
  onFavoriteChange?: () => void;
}

export default function RecipeCard({ recipe, onFavoriteChange }: RecipeCardProps) {
  const navigate = useNavigate();
  const { user, isFavorite, toggleFavorite } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleCardClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await toggleFavorite(recipe.id);
      onFavoriteChange?.();
    } catch (error) {
      console.error('收藏失败:', error);
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/recipe/${recipe.id}#comments`);
  };

  const getDifficultyStars = () => {
    switch (recipe.difficulty) {
      case 'easy': return 1;
      case 'medium': return 3;
      case 'hard': return 5;
      default: return 1;
    }
  };

  const isFav = isFavorite(recipe.id);

  return (
    <div className="card recipe-card" onClick={handleCardClick}>
      <div ref={imgRef} className="recipe-card-image-wrapper" style={{ position: 'relative', overflow: 'hidden', aspectRatio: '16 / 9' }}>
        {isInView && (
          <img
            src={recipe.image}
            alt={recipe.name}
            className="recipe-card-image"
            style={{
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
        )}
        {!imageLoaded && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '12px'
          }}>
            加载中...
          </div>
        )}
        <div className="recipe-card-hover-actions">
          <button
            className={`hover-btn ${isFav ? 'active' : ''}`}
            onClick={handleFavorite}
            title={isFav ? '取消收藏' : '收藏'}
          >
            {isFav ? '❤️' : '🤍'}
          </button>
          <button
            className="hover-btn"
            onClick={handleComment}
            title="评论"
          >
            💬
          </button>
        </div>
      </div>
      <div className="recipe-card-content">
        <h3 className="recipe-card-title">{recipe.name}</h3>
        <div className="recipe-card-meta">
          <div className="recipe-card-difficulty">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`star ${i < getDifficultyStars() ? 'filled' : ''}`}>
                ★
              </span>
            ))}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
            ⏱️ {recipe.cookTime}分钟
          </span>
        </div>
        <div className="recipe-card-author">
          <img src={recipe.authorAvatar} alt={recipe.authorName} />
          <span>{recipe.authorName}</span>
        </div>
      </div>
    </div>
  );
}
