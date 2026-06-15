import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
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
      style={{ animationDelay: `${index * 0.03}s` }}
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

interface MasonryItem {
  recipe: Recipe;
  matchPercentage?: number;
  height: number;
  top: number;
  left: number;
  column: number;
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
    isInitialized,
  } = useRecipeStore();

  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(4);
  const [masonryItems, setMasonryItems] = useState<MasonryItem[]>([]);
  const [containerHeight, setContainerHeight] = useState(0);
  const rafIdRef = useRef<number>();
  const cardHeightsRef = useRef<Map<string, number>>(new Map());

  const filteredRecipes = useMemo(() => getFilteredRecipes(), [filters, getFilteredRecipes, isInitialized]);
  const recommendedRecipes = useMemo(() => getRecommendedRecipes(), [userProfile, getRecommendedRecipes, isInitialized]);
  const visibleRecipes = useMemo(() => filteredRecipes.slice(0, visibleCount), [filteredRecipes, visibleCount]);
  const hasMore = visibleCount < filteredRecipes.length;

  const cuisines = ['全部', '法式', '意式', '中式'];
  const difficulties = ['全部', '简单', '中等', '困难'];
  const cookTimeRanges = ['全部', '<=15min', '15-45min', '>45min'];

  const getColumnCount = useCallback(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (width < 480) return 1;
    if (width < 768) return 2;
    if (width < 1024) return 3;
    return 4;
  }, []);

  const calculateMasonryLayout = useCallback(() => {
    if (!containerRef.current || visibleRecipes.length === 0) return;

    const columns = getColumnCount();
    const containerWidth = containerRef.current.offsetWidth;
    const gap = 20;
    const cardWidth = (containerWidth - gap * (columns - 1)) / columns;
    const columnHeights = new Array(columns).fill(0);
    const items: MasonryItem[] = [];

    visibleRecipes.forEach((recipe, index) => {
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      const estimatedHeight = cardHeightsRef.current.get(recipe.id) || 320;
      
      const top = columnHeights[shortestColumn];
      const left = shortestColumn * (cardWidth + gap);

      items.push({
        recipe,
        height: estimatedHeight,
        top,
        left,
        column: shortestColumn,
        matchPercentage: undefined,
      });

      columnHeights[shortestColumn] += estimatedHeight + gap;
    });

    setMasonryItems(items);
    setContainerHeight(Math.max(...columnHeights) - gap);
    setColumnCount(columns);
  }, [visibleRecipes, getColumnCount]);

  const measureCardHeight = useCallback((recipeId: string, element: HTMLDivElement | null) => {
    if (element) {
      const height = element.offsetHeight;
      cardHeightsRef.current.set(recipeId, height);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        calculateMasonryLayout();
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [calculateMasonryLayout]);

  useEffect(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      calculateMasonryLayout();
    });
  }, [calculateMasonryLayout]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      calculateMasonryLayout();
    }, 100);
    return () => clearTimeout(timeout);
  }, [visibleRecipes.length, calculateMasonryLayout]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const getCardStyle = (item: MasonryItem) => {
    const columns = columnCount;
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const gap = 20;
    const cardWidth = columns > 0 ? (containerWidth - gap * (columns - 1)) / columns : 280;
    
    return {
      position: 'absolute' as const,
      top: item.top,
      left: item.left,
      width: cardWidth,
      transform: `translate3d(0, 0, 0)`,
      willChange: 'transform',
    } as React.CSSProperties;
  };

  if (!isInitialized) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">🍳</div>
        <p className="retro-font">正在翻开食谱卡片...</p>
      </div>
    );
  }

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
        <>
          <div
            ref={containerRef}
            className="masonry-container-js"
            style={{
              position: 'relative',
              height: containerHeight,
              width: '100%',
            }}
          >
            {masonryItems.map((item, index) => (
              <div
                key={item.recipe.id}
                ref={(el) => measureCardHeight(item.recipe.id, el)}
                style={getCardStyle(item)}
              >
                <RecipeCard
                  recipe={item.recipe}
                  matchPercentage={item.matchPercentage}
                  index={index}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <p className="empty-state-text">暂无符合条件的食谱...</p>
        </div>
      )}

      <div ref={sentinelRef} style={{ height: '20px', marginTop: '20px' }} />

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
