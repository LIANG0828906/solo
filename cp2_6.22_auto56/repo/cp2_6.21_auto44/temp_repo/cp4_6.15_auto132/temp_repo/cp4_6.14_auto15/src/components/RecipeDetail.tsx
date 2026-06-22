import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RatingStars from './RatingStars';
import CommentSection from './CommentSection';
import { useLazyImage } from '../hooks/useLazyImage';
import { useStore } from '../store/useStore';
import { getIngredientDetail } from '../utils/api';
import { cuisineLabel, difficultyLabel, difficultyColor, formatDate } from '../utils/helpers';
import type { Recipe, IngredientDetail } from '../types';

interface RecipeDetailProps {
  recipe: Recipe;
  onIngredientClick: (name: string) => void;
  onRatingChange: (rating: number) => void;
  onFavoriteToggle: () => void;
  activeIngredient: IngredientDetail | null;
  setActiveIngredient: (ing: IngredientDetail | null) => void;
}

export default function RecipeDetail(props: RecipeDetailProps) {
  const { recipe, onIngredientClick, onRatingChange, onFavoriteToggle, activeIngredient, setActiveIngredient } = props;
  const navigate = useNavigate();
  const { ref, loaded } = useLazyImage();
  const { isFavorite, showToast } = useStore();
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [loadingIng, setLoadingIng] = useState(false);
  const favorited = isFavorite(recipe.id);

  const handleFavorite = () => {
    setHeartAnimating(true);
    onFavoriteToggle();
    setTimeout(() => setHeartAnimating(false), 400);
  };

  const handleIngredientClick = async (name: string) => {
    setLoadingIng(true);
    try {
      const detail = await getIngredientDetail(name);
      setActiveIngredient(detail);
    } catch (e) {
      showToast('获取食材详情失败', 'error');
    } finally {
      setLoadingIng(false);
    }
  };

  return (
    <div>
      {/* 大图区 */}
      <div style={{ position: 'relative', width: '100%', height: '60vh', overflow: 'hidden', background: '#f0f0f0' }}>
        {!loaded && <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />}
        <img ref={ref} src={loaded ? recipe.image : undefined} alt={recipe.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 0.5s' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.05) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 24px 28px', color: 'white' }}>
          <div className="app-container">
            <button onClick={() => navigate(-1)} style={{ color: 'white', marginBottom: 16, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 4, opacity: 0.9 }}>
              ← 返回
            </button>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(255,111,0,0.9)', fontSize: 13, fontWeight: 500 }}>{cuisineLabel(recipe.cuisine)}</span>
              <span style={{ padding: '6px 14px', borderRadius: 20, background: difficultyColor(recipe.difficulty), fontSize: 13, fontWeight: 500, opacity: 0.92 }}>{difficultyLabel(recipe.difficulty)}</span>
              <span style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', fontSize: 13, fontWeight: 500 }}>⏱ {recipe.cookTime}分钟</span>
            </div>
            <h1 style={{ fontSize: 38, fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>{recipe.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RatingStars value={recipe.rating} size={18} />
                <span style={{ fontWeight: 600 }}>{recipe.rating.toFixed(1)}</span>
                <span style={{ opacity: 0.7 }}>({recipe.ratingCount}评价)</span>
              </div>
              <span style={{ opacity: 0.6 }}>· 发布于 {formatDate(recipe.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="app-container" style={{ padding: '24px 16px 32px' }}>
        {/* 操作栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-light)', fontSize: 14 }}>给这道菜评分：</span>
            <RatingStars value={Math.round(recipe.rating)} editable size={28} onChange={(v) => onRatingChange(v)} />
          </div>
          <button onClick={handleFavorite}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', borderRadius: 24, fontWeight: 600, fontSize: 15,
              background: favorited ? 'var(--primary)' : '#fff',
              color: favorited ? 'white' : 'var(--primary)',
              boxShadow: favorited ? '0 4px 12px rgba(255,111,0,0.35)' : 'var(--shadow)',
              border: favorited ? 'none' : '1px solid var(--primary)',
              animation: heartAnimating ? 'heart-bounce 0.4s ease' : undefined,
              transition: 'all 0.2s',
            }}>
            <svg viewBox="0 0 24 24" width="18" height="18"
              fill={favorited ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {favorited ? '已收藏' : '收藏食谱'}
          </button>
        </div>

        {/* 描述 */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, marginBottom: 24, boxShadow: 'var(--shadow)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>简介</h3>
          <p style={{ color: 'var(--text-light)', fontSize: 15, lineHeight: 1.8 }}>{recipe.description}</p>
          {recipe.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              {recipe.tags.map((t) => (
                <span key={t} style={{ padding: '4px 12px', background: 'rgba(255,179,0,0.15)', color: '#E65100', fontSize: 13, borderRadius: 12, fontWeight: 500 }}>
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 食材 */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, marginBottom: 24, boxShadow: 'var(--shadow)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>🥕 食材清单</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {recipe.ingredients.map((ing) => (
              <button key={ing.name} onClick={() => handleIngredientClick(ing.name)}
                style={{
                  textAlign: 'left', padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(255,111,0,0.06)', fontSize: 14, fontWeight: 500,
                  transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,111,0,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,111,0,0.06)'; }}
              >
                <span style={{ color: 'var(--text)' }}>{ing.name}</span>
                <span style={{ color: 'var(--primary)', fontSize: 13 }}>{ing.amount}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 步骤 */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, marginBottom: 24, boxShadow: 'var(--shadow)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>👨‍🍳 制作步骤</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {recipe.steps.map((s) => (
              <div key={s.step} style={{ display: 'flex', gap: 16 }}>
                <div style={{
                  flexShrink: 0, width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--primary)', color: 'white', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(255,111,0,0.3)',
                }}>{s.step}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text)', paddingTop: 8 }}>{s.description}</p>
                  {s.image && (
                    <img src={s.image} alt={`步骤${s.step}`} loading="lazy"
                      style={{ width: '100%', maxWidth: 500, borderRadius: 12, marginTop: 12, boxShadow: 'var(--shadow)' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 评论 */}
        <CommentSection recipeId={recipe.id} />
      </div>

      {/* 食材详情弹窗 */}
      {activeIngredient && (
        <div onClick={() => setActiveIngredient(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn 0.25s ease' }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 480, width: '100%', maxHeight: '85vh', overflowY: 'auto', animation: 'slide-up 0.3s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            {loadingIng ? (
              <div style={{ textAlign: 'center', padding: 24 }}>加载中...</div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{activeIngredient.name}</h3>
                  <button onClick={() => setActiveIngredient(null)} style={{ fontSize: 22, color: '#999', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>✕</button>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>🌍 产地</div>
                  <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.6 }}>{activeIngredient.origin}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>ℹ️ 介绍</div>
                  <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.7 }}>{activeIngredient.description}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>🔄 替代品</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {activeIngredient.substitutes.map((sub) => (
                      <span key={sub} style={{ padding: '6px 14px', background: 'rgba(255,179,0,0.15)', color: '#E65100', borderRadius: 16, fontSize: 13, fontWeight: 500 }}>{sub}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
