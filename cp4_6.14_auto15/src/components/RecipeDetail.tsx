import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RatingStars from './RatingStars';
import CommentSection from './CommentSection';
import { useLazyImage } from '../hooks/useLazyImage';
import { useStore } from '../store/useStore';
import { cuisineLabel, difficultyLabel, difficultyColor } from '../utils/helpers';
import type { Recipe, IngredientDetail } from '../types';

interface RecipeDetailProps {
  recipe: Recipe;
  onIngredientClick: (name: string) => void;
  onRatingChange: (rating: number) => void;
  onFavoriteToggle: () => void;
  activeIngredient: IngredientDetail | null;
  setActiveIngredient: (ing: IngredientDetail | null) => void;
}

export default function RecipeDetail({
  recipe,
  onIngredientClick,
  onRatingChange,
  onFavoriteToggle,
  activeIngredient,
  setActiveIngredient,
}: RecipeDetailProps) {
  const navigate = useNavigate();
  const { ref, loaded } = useLazyImage();
  const { isFavorite } = useStore();
  const [heartAnimating, setHeartAnimating] = useState(false);
  const favorited = isFavorite(recipe.id);

  const handleFavorite = () => {
    setHeartAnimating(true);
    onFavoriteToggle();
    setTimeout(() => setHeartAnimating(false), 500);
  };

  return (
    <div>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '60vh',
        overflow: 'hidden',
      }}>
        {!loaded && <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />}
        <img
          ref={ref}
          src={recipe.coverImage}
          alt={recipe.title}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.5s',
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '32px 24px 28px',
          color: 'white',
        }}>
          <div className="app-container">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: 'rgba(255,111,0,0.9)',
                fontSize: 13,
                fontWeight: 500,
              }}>
                {cuisineLabel(recipe.cuisine)}
              </span>
              <span style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: difficultyColor(recipe.difficulty) + 'E6',
                fontSize: 13,
                fontWeight: 500,
              }}>
                {difficultyLabel(recipe.difficulty)}
              </span>
              <span style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.2)',
                fontSize: 13,
                fontWeight: 500,
                backdropFilter: 'blur(10px)',
              }}>
                ⏱️ {recipe.cookingTime}分钟
              </span>
              <span style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.2)',
                fontSize: 13,
                fontWeight: 500,
                backdropFilter: 'blur(10px)',
              }}>
                👥 {recipe.servings}人份
              </span>
            </div>
            <h1 style={{
              fontSize: 36,
              fontWeight: 700,
              marginBottom: 8,
              lineHeight: 1.2,
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}>
              {recipe.title}
            </h1>
            <p style={{
              fontSize: 15,
              opacity: 0.9,
              maxWidth: 800,
              lineHeight: 1.6,
            }}>
              {recipe.description}
            </p>
          </div>
        </div>

        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <button
            onClick={handleFavorite}
            className={heartAnimating ? 'heart-bounce' : ''}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s',
              animation: heartAnimating ? 'heart-bounce 0.5s ease' : undefined,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={favorited ? '#ef4444' : 'none'}
              stroke={favorited ? '#ef4444' : 'currentColor'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="app-container" style={{ padding: '28px 16px 0', marginTop: -20, position: 'relative', zIndex: 5 }}>
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: 20,
          padding: 24,
          boxShadow: 'var(--shadow)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              fontSize: 18,
            }}>
              {recipe.author.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{recipe.author}</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)' }}>食谱作者</div>
            </div>
          </div>
          <RatingStars
            value={recipe.rating}
            count={recipe.ratingCount}
            editable
            onChange={onRatingChange}
            size={24}
          />
        </div>
      </div>

      <div className="app-container" style={{ padding: '0 16px 48px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: 20,
            padding: 28,
            boxShadow: 'var(--shadow)',
          }}>
            <h2 style={{
              fontSize: 22,
              fontWeight: 600,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              🧺 食材清单
            </h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
            }}>
              {recipe.ingredients.map((ing, idx) => (
                <button
                  key={`${ing.name}-${idx}`}
                  onClick={() => onIngredientClick(ing.name)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, #FFF8E1, #FFECB3)',
                    border: '2px solid transparent',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.25s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #FFF8E1, #FFECB3)';
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{ing.name}</span>
                  <span style={{ opacity: 0.7 }}>{ing.amount}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{
            background: 'var(--card-bg)',
            borderRadius: 20,
            padding: 28,
            boxShadow: 'var(--shadow)',
          }}>
            <h2 style={{
              fontSize: 22,
              fontWeight: 600,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              👨‍🍳 制作步骤
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {recipe.steps.map((step) => (
                <div
                  key={step.order}
                  style={{
                    display: 'flex',
                    gap: 16,
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(255,111,0,0.3)',
                  }}>
                    {step.order}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      marginBottom: step.image ? 12 : 0,
                      color: 'var(--text)',
                    }}>
                      {step.description}
                    </p>
                    {step.image && (
                      <div style={{
                        borderRadius: 12,
                        overflow: 'hidden',
                        maxWidth: 400,
                      }}>
                        <img
                          src={step.image}
                          alt={`步骤${step.order}`}
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <CommentSection recipeId={recipe.id} />
        </div>
      </div>

      {activeIngredient && (
        <div
          onClick={() => setActiveIngredient(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 20,
              padding: 32,
              maxWidth: 480,
              width: '100%',
              position: 'relative',
              animation: 'slide-up 0.35s ease',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <button
              onClick={() => setActiveIngredient(null)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e5e5e5';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f5f5f5';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div style={{ marginBottom: 20 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 28,
                marginBottom: 16,
              }}>
                🥗
              </div>
              <h3 style={{
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 4,
              }}>
                {activeIngredient.name}
              </h3>
              {activeIngredient.origin && (
                <p style={{ fontSize: 14, color: 'var(--text-light)' }}>
                  产地：{activeIngredient.origin}
                </p>
              )}
            </div>

            {activeIngredient.description && (
              <div style={{
                background: '#fafafa',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}>
                <h4 style={{ fontSize: 13, fontWeight: 600,