import { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipeStore } from '../../stores/recipeStore';
import type { Recipe, RecipeWithMatch } from '../../types';

interface RecipeCardProps {
  recipe: Recipe;
  matchPercentage?: number;
  index: number;
}

function RecipeCard({ recipe, matchPercentage, index }: RecipeCardProps) {
  const navigate = useNavigate();
  const { likedRecipes, likeRecipe, unlikeRecipe } = useRecipeStore();
  const isLiked = likedRecipes.includes(recipe.id);

  const handleClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      unlikeRecipe(recipe.id);
    } else {
      likeRecipe(recipe.id);
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case '简单': return '🥄';
      case '中等': return '🍳';
      case '困难': return '👨‍🍳';
      default: return '🍳';
    }
  };

  const getTimeIcon = (time: number) => {
    if (time <= 15) return '⚡';
    if (time <= 45) return '⏰';
    return '🕰️';
  };

  const formatTime = (time: number) => {
    if (time < 60) return `${time}分钟`;
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  };

  return (
    <div
      className="recipe-card fade-in"
      onClick={handleClick}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="recipe-card-image">
        <img src={recipe.coverImage} alt={recipe.name} loading="lazy" />
        <span className="recipe-card-cuisine retro-font">{recipe.cuisine}</span>
        {matchPercentage !== undefined && matchPercentage > 70 && (
          <span className="recipe-card-match">{matchPercentage}% 匹配</span>
        )}
      </div>
      <div className="recipe-card-content">
        <h3 className="recipe-card-title">{recipe.name}</h3>
        <p className="recipe-card-story">{recipe.story}</p>
        <div className="recipe-card-footer">
          <div className="recipe-card-stats">
            <span className="recipe-card-stat">
              {getDifficultyIcon(recipe.difficulty)} {recipe.difficulty}
            </span>
            <span className="recipe-card-stat">
              {getTimeIcon(recipe.cookTime)} {formatTime(recipe.cookTime)}
            </span>
          </div>
          <button
            className={`like-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLikeClick}
          >
            <span className="like-icon">{isLiked ? '❤️' : '🤍'}</span>
            <span>{recipe.likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecipeList() {
  const {
    filters,
    setFilters,
    getFilteredRecipes,
    visibleCount,
    loadMore,
    getRecommendedRecipes,
    userProfile,
  } = useRecipeStore();

  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const filteredRecipes = useMemo(() => getFilteredRecipes(), [filters, getFilteredRecipes]);
  const recommendedRecipes = useMemo(() => getRecommendedRecipes(), [userProfile, getRecommendedRecipes]);
  const visibleRecipes = filteredRecipes.slice(0, visibleCount);
  const hasMore = visibleCount < filteredRecipes.length;

  const cuisines = ['全部', '法式', '意式', '中式'];
  const difficulties = ['全部', '简单', '中等', '困难'];
  const cookTimeRanges = ['全部', '<=15min', '15-45min', '>45min'];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div>
      <div className="hero-section">
        <h1 className="hero-title">复古食谱卡片</h1>
        <p className="hero-subtitle">翻寻那些有年代感的经典味道 ✨</p>
      </div>

      {userProfile && recommendedRecipes.length > 0 && (
        <div className="recommended-section">
          <div className="section-header">
            <span className="section-title">🎯 为你推荐</span>
            <div className="section-divider" />
          </div>
          <div className="recommended-scroll">
            {recommendedRecipes.slice(0, 8).map((recipe, index) => (
              <div key={recipe.id} className="recommended-card">
                <RecipeCard
                  recipe={recipe}
                  matchPercentage={recipe.matchPercentage}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="filter-bar">
        <div className="filter-section-title retro-font">🔍 筛选食谱</div>
        <div className="filter-groups">
          <div className="filter-group">
            <label>菜系</label>
            <select
              value={filters.cuisine}
              onChange={(e) => setFilters({ cuisine: e.target.value })}
            >
              {cuisines.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>难度</label>
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({ difficulty: e.target.value })}
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>烹饪时间</label>
            <select
              value={filters.cookTimeRange}
              onChange={(e) => setFilters({ cookTimeRange: e.target.value })}
            >
              {cookTimeRanges.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>&nbsp;</label>
            <button
              className="submit-comment-btn"
              onClick={() => navigate('/profile')}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              + 创建食谱
            </button>
          </div>
        </div>
      </div>

      {visibleRecipes.length > 0 ? (
        <div className="masonry-container">
          {visibleRecipes.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={index} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <p className="empty-state-text">暂无符合条件的食谱...</p>
        </div>
      )}

      <div ref={sentinelRef} style={{ height: '20px' }} />

      {hasMore && (
        <div className="load-more-container">
          <button className="load-more-btn" onClick={loadMore}>
            加载更多食谱...
          </button>
        </div>
      )}
    </div>
  );
}
