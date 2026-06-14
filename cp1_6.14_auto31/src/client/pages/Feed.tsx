import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, Recipe } from '../App';

const RecipeCard = React.memo(function RecipeCard({ recipe, onLike }: { recipe: Recipe; onLike: (id: string) => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const liked = user ? recipe.likes.includes(user.id) : false;

  return (
    <div
      onClick={() => navigate(`/recipe/${recipe.id}`)}
      style={{
        background: '#fff', borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'all 0.3s ease',
        animation: 'fadeInUp 0.5s ease forwards', opacity: 0,
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
        <img src={recipe.image} alt={recipe.name}
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
      <div style={{ padding: 14 }}>
        <h3 style={{
          fontSize: 16, fontWeight: 600, color: '#3D2C1E', marginBottom: 8,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {recipe.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button onClick={e => { e.stopPropagation(); onLike(recipe.id); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, background: 'none',
              fontSize: 14, color: liked ? '#E53935' : '#8B7355', transition: 'color 0.3s',
            }}>
            {liked ? '❤️' : '🤍'} {recipe.likes.length}
          </button>
          <span style={{ fontSize: 12, color: '#8B7355', background: '#FFF8F0', padding: '2px 8px', borderRadius: 10 }}>
            ⏱ {recipe.cookTime}分钟
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <img src={recipe.authorAvatar || `https://ui-avatars.com/api/?name=${recipe.authorName}&background=F5A623&color=fff`}
            alt={recipe.authorName} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontSize: 13, color: '#8B7355' }}>{recipe.authorName}</span>
        </div>
        {recipe.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {recipe.tags.map(tag => (
              <span key={tag} style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 10,
                background: tag === '低脂' ? '#E8F5E9' : tag === '高蛋白' ? '#FFF3E0' : tag === '素食' ? '#F1F8E9' : tag === '低碳水' ? '#E3F2FD' : tag === '无麸质' ? '#FCE4EC' : '#FFF8E1',
                color: tag === '低脂' ? '#4CAF50' : tag === '高蛋白' ? '#FF9800' : tag === '素食' ? '#7CB342' : tag === '低碳水' ? '#2196F3' : tag === '无麸质' ? '#E91E63' : '#F5A623',
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
    }}>
      <div style={{ width: '100%', height: 180, background: '#F0E6D8', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ padding: 14 }}>
        <div style={{ width: '70%', height: 16, background: '#F0E6D8', borderRadius: 4, marginBottom: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: '40%', height: 12, background: '#F0E6D8', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
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
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const fetchRecipes = useCallback(async (pageNum: number, tabName: 'latest' | 'popular', append: boolean) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/recipes?tab=${tabName}&page=${pageNum}&limit=12`);
      const newRecipes = res.data.recipes as Recipe[];
      if (append) {
        setRecipes(prev => [...prev, ...newRecipes]);
      } else {
        setRecipes(newRecipes);
      }
      setTotal(res.data.total);
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setInitialLoading(true);
    fetchRecipes(1, tab, false);
  }, [tab, fetchRecipes]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && recipes.length < total) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchRecipes(nextPage, tab, true);
      }
    }, { threshold: 0.1 });
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [loading, recipes.length, total, page, tab, fetchRecipes]);

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
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20,
        }}>
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : recipes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#8B7355' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🍽️</p>
          <p style={{ fontSize: 16 }}>暂无菜谱，快来发布第一个吧！</p>
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20,
        }}>
          {recipes.map((recipe, index) => (
            <div key={recipe.id} style={{ animationDelay: `${(index % 12) * 0.05}s` }}>
              <RecipeCard recipe={recipe} onLike={handleLike} />
            </div>
          ))}
        </div>
      )}

      {loading && !initialLoading && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginTop: 20,
        }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      <div ref={loadMoreRef} style={{ height: 40 }} />

      {!loading && recipes.length > 0 && recipes.length >= total && (
        <p style={{ textAlign: 'center', color: '#8B7355', fontSize: 14, marginTop: 20 }}>已加载全部菜谱</p>
      )}
    </div>
  );
}
