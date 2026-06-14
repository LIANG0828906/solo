import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FixedSizeGrid, GridOnItemsRenderedProps } from 'react-window';
import axios from 'axios';
import { useAuth, Recipe } from '../App';

const CARD_WIDTH = 280;
const CARD_HEIGHT = 320;
const GAP = 20;
const PAGE_SIZE = 12;

const RecipeCard = React.memo(function RecipeCard({ recipe, onLike, style }: {
  recipe: Recipe;
  onLike: (id: string) => void;
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const liked = user ? recipe.likes.includes(user.id) : false;

  return (
    <div
      onClick={() => navigate(`/recipe/${recipe.id}`)}
      style={{
        background: '#fff', borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
      }}
    >
      {recipe.image ? (
        <img src={recipe.image} alt={recipe.name} loading="lazy"
          style={{ width: '100%', height: 180, objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: '100%', height: 180,
          background: 'linear-gradient(135deg, #F5A623 0%, #E8913A 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40,
        }}>
          🍽️
        </div>
      )}
      <div style={{ padding: 12 }}>
        <h3 style={{
          fontSize: 15, fontWeight: 600, color: '#3D2C1E', marginBottom: 6,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
          height: 20,
        }}>
          {recipe.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <button onClick={e => { e.stopPropagation(); onLike(recipe.id); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, background: 'none',
              fontSize: 13, color: liked ? '#E53935' : '#8B7355', transition: 'color 0.3s',
              padding: 0,
            }}>
            {liked ? '❤️' : '🤍'} {recipe.likes.length}
          </button>
          <span style={{ fontSize: 11, color: '#8B7355', background: '#FFF8F0', padding: '2px 6px', borderRadius: 8 }}>
            ⏱ {recipe.cookTime}分
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <img src={recipe.authorAvatar || `https://ui-avatars.com/api/?name=${recipe.authorName}&background=F5A623&color=fff`}
            alt={recipe.authorName} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontSize: 12, color: '#8B7355' }}>{recipe.authorName}</span>
        </div>
        {recipe.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {recipe.tags.slice(0, 2).map(tag => (
              <span key={tag} style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 8,
                background: tag === '低脂' ? '#E8F5E9' : tag === '高蛋白' ? '#FFF3E0' : '#FFF8E1',
                color: tag === '低脂' ? '#4CAF50' : tag === '高蛋白' ? '#FF9800' : '#F5A623',
                fontWeight: 500,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

function SkeletonCard() {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    }}>
      <div style={{ width: '100%', height: 180, background: '#F0E6D8', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ padding: 12 }}>
        <div style={{ width: '70%', height: 16, background: '#F0E6D8', borderRadius: 4, marginBottom: 10 }} />
        <div style={{ width: '40%', height: 12, background: '#F0E6D8', borderRadius: 4 }} />
      </div>
    </div>
  );
}

export default function Feed() {
  const [tab, setTab] = useState<'latest' | 'popular'>('latest');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [gridHeight, setGridHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<FixedSizeGrid | null>(null);
  const loadingRef = useRef(false);
  const { user } = useAuth();

  const columnCount = useMemo(() => {
    if (containerWidth <= 0) return 3;
    const cols = Math.floor((containerWidth + GAP) / (CARD_WIDTH + GAP));
    return Math.max(1, Math.min(cols, 6));
  }, [containerWidth]);

  const rowCount = useMemo(() => {
    const baseRows = Math.ceil(recipes.length / columnCount);
    return loading ? baseRows + 1 : baseRows;
  }, [recipes.length, columnCount, loading]);

  useEffect(() => {
    const updateSize = () => {
      setGridHeight(Math.max(400, window.innerHeight - 160));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const fetchRecipes = useCallback(async (pageNum: number, tabName: 'latest' | 'popular', append: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await axios.get(`/api/recipes?tab=${tabName}&page=${pageNum}&limit=${PAGE_SIZE}`);
      const newRecipes = res.data.recipes as Recipe[];
      if (append) {
        setRecipes(prev => [...prev, ...newRecipes]);
      } else {
        setRecipes(newRecipes);
      }
      setTotal(res.data.total);
    } catch {
      setRecipes([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setInitialLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadingRef.current = false;
    setPage(1);
    setInitialLoading(true);
    setRecipes([]);
    fetchRecipes(1, tab, false);
  }, [tab, fetchRecipes]);

  const handleItemsRendered = useCallback(({ visibleRowStop }: GridOnItemsRenderedProps) => {
    const lastVisibleIndex = (visibleRowStop + 1) * columnCount;
    if (
      !loadingRef.current &&
      recipes.length > 0 &&
      recipes.length < total &&
      lastVisibleIndex >= recipes.length - columnCount * 2
    ) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRecipes(nextPage, tab, true);
    }
  }, [recipes.length, total, columnCount, page, tab, fetchRecipes]);

  const handleLike = async (recipeId: string) => {
    if (!user) return;
    try {
      const res = await axios.post(`/api/recipes/${recipeId}/like`);
      const liked = res.data.liked;
      setRecipes(prev => prev.map(r => {
        if (r.id !== recipeId) return r;
        return {
          ...r,
          likes: liked ? [...r.likes, user.id] : r.likes.filter(id => id !== user.id),
        };
      }));
    } catch {}
  };

  const Cell = useCallback(({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= recipes.length) {
      if (loading && index < recipes.length + columnCount) {
        return (
          <div style={{ ...style, padding: GAP / 2, boxSizing: 'border-box' }}>
            <SkeletonCard />
          </div>
        );
      }
      return null;
    }
    const recipe = recipes[index];
    return (
      <div style={{ ...style, padding: GAP / 2, boxSizing: 'border-box' }}>
        <RecipeCard recipe={recipe} onLike={handleLike} />
      </div>
    );
  }, [recipes, columnCount, loading, handleLike]);

  const gridWidth = columnCount * (CARD_WIDTH + GAP) - GAP;

  return (
    <div style={{ paddingTop: 76, maxWidth: 1200, margin: '0 auto', padding: '76px 16px 40px' }}>
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '2px solid #F0E6D8' }}>
        {(['latest', 'popular'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '10px 28px', fontSize: 16, fontWeight: 600, background: 'none',
              color: tab === t ? '#F5A623' : '#8B7355',
              borderBottom: tab === t ? '2.5px solid #F5A623' : '2.5px solid transparent',
              marginBottom: -2, transition: 'all 0.3s',
            }}>
            {t === 'latest' ? '最新发布' : '热门点赞'}
          </button>
        ))}
      </div>

      {initialLoading ? (
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))`, gap: GAP,
        }}>
          {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : recipes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#8B7355' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🍽️</p>
          <p style={{ fontSize: 16 }}>暂无菜谱，快来发布第一个吧！</p>
        </div>
      ) : (
        <>
          <div ref={containerRef} style={{ width: '100%' }}>
            <FixedSizeGrid
              ref={gridRef as any}
              columnCount={columnCount}
              columnWidth={CARD_WIDTH + GAP}
              rowCount={Math.max(rowCount, 1)}
              rowHeight={CARD_HEIGHT + GAP}
              width={gridWidth > 0 ? gridWidth : containerWidth}
              height={gridHeight}
              style={{ overflowX: 'hidden', margin: '0 auto', scrollBehavior: 'smooth' }}
              itemKey={({ columnIndex, rowIndex }) => {
                const idx = rowIndex * columnCount + columnIndex;
                return recipes[idx]?.id || `skeleton-${rowIndex}-${columnIndex}`;
              }}
              onItemsRendered={handleItemsRendered}
            >
              {Cell as any}
            </FixedSizeGrid>
          </div>
          <p style={{ textAlign: 'center', color: '#8B7355', fontSize: 13, marginTop: 12 }}>
            {loading ? '加载中...' : recipes.length >= total ? `已加载全部 ${total} 道菜谱` : `已加载 ${recipes.length} / ${total}`}
          </p>
        </>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
