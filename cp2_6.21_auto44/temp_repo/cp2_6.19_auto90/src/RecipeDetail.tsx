import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Recipe,
  Ingredient,
  MatchResult,
  RecipeIngredient,
  getGradientTint,
  getTimeTagColor,
  calculateMatch,
} from './data';

interface Props {
  recipe: Recipe;
  allMatches: MatchResult[];
  ingredients: Ingredient[];
  onClose: () => void;
  onSelectOther: (recipe: Recipe) => void;
}

const styles = `
  .rd-backdrop {
    position: fixed;
    inset: 0;
    z-index: 150;
    background: rgba(62, 39, 35, 0.35);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    animation: rd-fadeIn 0.3s ease;
  }

  @keyframes rd-fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes rd-fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  .rd-sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 151;
    background: #FFF8F0;
    border-radius: 28px 28px 0 0;
    box-shadow: 0 -20px 60px rgba(62, 39, 35, 0.25);
    max-height: 92vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: rd-slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes rd-slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  @media (min-width: 900px) {
    .rd-sheet {
      left: 50%;
      right: auto;
      transform: translateX(-50%);
      width: 100%;
      max-width: 780px;
      border-radius: 28px;
      top: 50%;
      bottom: auto;
      max-height: 88vh;
      transform: translate(-50%, -50%);
      animation: rd-popIn 0.45s cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes rd-popIn {
      from { transform: translate(-50%, calc(-50% + 60px)); opacity: 0; }
      to { transform: translate(-50%, -50%); opacity: 1; }
    }
  }

  .rd-close-btn {
    position: absolute;
    top: 18px;
    right: 20px;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(8px);
    cursor: pointer;
    font-size: 18px;
    color: #fff;
    z-index: 5;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .rd-close-btn:hover {
    background: rgba(255, 255, 255, 0.5);
    transform: rotate(90deg) scale(1.05);
  }

  .rd-close-btn:active {
    transform: rotate(90deg) scale(0.95);
  }

  .rd-hero {
    width: 100%;
    aspect-ratio: 16 / 9;
    max-height: 280px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .rd-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 25% 30%, rgba(255,255,255,0.25), transparent 55%),
      linear-gradient(to bottom, transparent 55%, rgba(62, 39, 35, 0.35) 100%);
    pointer-events: none;
  }

  .rd-hero-emoji {
    font-size: 110px;
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 6px 14px rgba(0,0,0,0.22));
  }

  .rd-hero-info {
    position: absolute;
    left: 24px;
    right: 80px;
    bottom: 20px;
    z-index: 2;
  }

  .rd-hero-name {
    font-size: 26px;
    font-weight: 800;
    color: #fff;
    text-shadow: 0 2px 8px rgba(0,0,0,0.3);
    margin-bottom: 8px;
    line-height: 1.2;
  }

  .rd-hero-meta {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .rd-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.28);
    backdrop-filter: blur(8px);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
  }

  .rd-pill.time {
    background: var(--pill-color, #fff);
  }

  .rd-drag-bar {
    display: block;
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: 44px;
    height: 5px;
    border-radius: 999px;
    background: rgba(255,255,255,0.6);
    backdrop-filter: blur(8px);
    z-index: 10;
  }

  @media (min-width: 900px) {
    .rd-drag-bar { display: none; }
  }

  .rd-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px 24px 30px;
    -webkit-overflow-scrolling: touch;
  }

  @media (max-width: 640px) {
    .rd-content {
      padding: 18px 18px 26px;
    }
    .rd-hero-name {
      font-size: 22px;
    }
    .rd-hero-emoji {
      font-size: 88px;
    }
  }

  .rd-section-title {
    font-size: 18px;
    font-weight: 800;
    color: #3E2723;
    margin: 0 0 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rd-section-title::before {
    content: '';
    width: 4px;
    height: 20px;
    border-radius: 4px;
    background: linear-gradient(180deg, #F97316, #EA580C);
  }

  .rd-section {
    margin-bottom: 26px;
  }

  .rd-serving-bar {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    background: #fff;
    border-radius: 16px;
    border: 1px solid rgba(139, 69, 19, 0.08);
    box-shadow: 0 2px 10px rgba(139, 69, 19, 0.05);
    flex-wrap: wrap;
  }

  .rd-serving-label {
    font-size: 14px;
    font-weight: 600;
    color: #6D4C41;
  }

  .rd-serving-value {
    font-size: 22px;
    font-weight: 800;
    color: #F97316;
    min-width: 70px;
    text-align: center;
  }

  .rd-serving-btn {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 10px rgba(249, 115, 22, 0.3);
  }

  .rd-serving-btn:hover {
    transform: scale(1.08);
    box-shadow: 0 5px 16px rgba(249, 115, 22, 0.4);
  }

  .rd-serving-btn:active {
    transform: scale(0.94);
  }

  .rd-serving-btn:disabled {
    background: rgba(139, 69, 19, 0.2);
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  .rd-serving-btn:disabled:hover {
    transform: none;
  }

  .rd-serving-preset {
    display: inline-flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-left: auto;
  }

  .preset-btn {
    padding: 6px 12px;
    border-radius: 10px;
    border: 1.5px solid rgba(139, 69, 19, 0.12);
    background: transparent;
    color: #6D4C41;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .preset-btn:hover {
    border-color: rgba(249, 115, 22, 0.4);
    background: rgba(249, 115, 22, 0.06);
  }

  .preset-btn.active {
    background: rgba(249, 115, 22, 0.12);
    border-color: #F97316;
    color: #C2410C;
  }

  .rd-ingredient-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
  }

  @media (max-width: 640px) {
    .rd-ingredient-grid {
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
  }

  .rd-ing-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid rgba(139, 69, 19, 0.07);
    transition: all 0.25s ease;
  }

  .rd-ing-row.matched {
    background: rgba(34, 197, 94, 0.06);
    border-color: rgba(34, 197, 94, 0.18);
  }

  .rd-ing-row.missing {
    background: rgba(239, 68, 68, 0.04);
    border-color: rgba(239, 68, 68, 0.12);
  }

  .rd-ing-name {
    font-size: 14px;
    font-weight: 600;
    color: #3E2723;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .rd-ing-name .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .rd-ing-name .dot.ok { background: #22C55E; }
  .rd-ing-name .dot.no { background: #EF4444; }

  .rd-ing-qty {
    font-size: 13px;
    font-weight: 700;
    color: #F97316;
    white-space: nowrap;
    display: inline-block;
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
                color 0.25s ease;
  }

  .rd-ing-qty.anim {
    animation: qty-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes qty-bounce {
    0%   { transform: scale(1); }
    35%  { transform: scale(1.28); }
    70%  { transform: scale(0.94); }
    100% { transform: scale(1); }
  }

  .rd-steps-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .rd-step-item {
    display: flex;
    gap: 14px;
    padding: 16px;
    background: #fff;
    border-radius: 16px;
    border: 1px solid rgba(139, 69, 19, 0.07);
    box-shadow: 0 2px 10px rgba(139, 69, 19, 0.04);
    align-items: flex-start;
    transition: all 0.25s ease;
  }

  .rd-step-item:hover {
    transform: translateX(4px);
    border-color: rgba(249, 115, 22, 0.2);
    box-shadow: 0 6px 18px rgba(139, 69, 19, 0.08);
  }

  .rd-step-num {
    width: 36px;
    height: 36px;
    min-width: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #F97316 0%, #D97706 100%);
    color: #fff;
    font-weight: 800;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(249, 115, 22, 0.3);
  }

  .rd-step-desc {
    font-size: 14px;
    line-height: 1.7;
    color: #4E342E;
    padding-top: 6px;
    font-weight: 500;
  }

  .rd-related {
    padding: 0 24px 28px;
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .rd-related {
      padding: 0 18px 24px;
    }
  }

  .rd-related-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .rd-scroll-wrap {
    position: relative;
  }

  .rd-scroll-area {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    padding: 4px 2px 8px;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }

  .rd-scroll-area::-webkit-scrollbar {
    display: none;
  }

  .rd-arrow-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: #fff;
    box-shadow: 0 4px 14px rgba(139, 69, 19, 0.2);
    cursor: pointer;
    z-index: 5;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    color: #6D4C41;
  }

  .rd-arrow-btn:hover {
    transform: translateY(-50%) scale(1.1);
    background: #F97316;
    color: #fff;
    box-shadow: 0 6px 18px rgba(249, 115, 22, 0.35);
  }

  .rd-arrow-btn:active {
    transform: translateY(-50%) scale(0.94);
  }

  .rd-arrow-btn.left { left: -8px; }
  .rd-arrow-btn.right { right: -8px; }

  @media (max-width: 640px) {
    .rd-arrow-btn { display: none; }
  }

  .rd-mini-card {
    min-width: 170px;
    width: 170px;
    scroll-snap-align: start;
    background: #fff;
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid rgba(139, 69, 19, 0.08);
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    flex-shrink: 0;
  }

  .rd-mini-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 24px rgba(139, 69, 19, 0.15);
    border-color: rgba(249, 115, 22, 0.25);
  }

  .rd-mini-img {
    aspect-ratio: 4 / 3;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    position: relative;
  }

  .rd-mini-time {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 600;
    color: #fff;
  }

  .rd-mini-body {
    padding: 10px 12px 12px;
  }

  .rd-mini-name {
    font-size: 13px;
    font-weight: 700;
    color: #3E2723;
    margin-bottom: 6px;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rd-mini-match {
    height: 5px;
    background: rgba(139, 69, 19, 0.08);
    border-radius: 999px;
    overflow: hidden;
  }

  .rd-mini-match-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #EF4444, #F97316, #22C55E);
    background-size: 200% 100%;
    transition: width 0.6s ease;
  }

  .rd-no-related {
    padding: 28px 16px;
    text-align: center;
    font-size: 13px;
    color: #A1887F;
    background: rgba(139, 69, 19, 0.04);
    border-radius: 14px;
  }
`;

const recipeEmojis = ['🍳', '🥘', '🍲', '🥗', '🍜', '🍛', '🥙', '🍱', '🥟', '🍤'];
const MIN_SERVINGS = 1;
const MAX_SERVINGS = 20;

function formatQty(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(n < 1 ? 2 : 1).replace(/\.?0+$/, '');
}

const RecipeDetail: React.FC<Props> = ({
  recipe,
  allMatches,
  ingredients,
  onClose,
  onSelectOther,
}) => {
  const [servings, setServings] = useState(recipe.servings);
  const [animKey, setAnimKey] = useState(0);
  const [closing, setClosing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setTimeout(() => {
      contentRef.current?.focus?.();
    }, 100);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(id);
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const ratio = servings / recipe.servings;
  const scaledIngredients: RecipeIngredient[] = useMemo(
    () =>
      recipe.ingredients.map((ing) => ({
        ...ing,
        quantity: Number((ing.quantity * ratio).toFixed(3)),
      })),
    [recipe.ingredients, ratio]
  );

  const gradient = getGradientTint(recipe.imageTint ?? 0);
  const emoji = recipeEmojis[(recipe.imageTint ?? 0) % recipeEmojis.length];
  const timeColor = getTimeTagColor(recipe.cookTime);

  const ingredientNames = ingredients.map((i) => i.name.trim().toLowerCase());
  const ingredientMatched = (name: string): 'ok' | 'no' => {
    const n = name.trim().toLowerCase();
    return ingredientNames.some((x) => x.includes(n) || n.includes(x))
      ? 'ok'
      : 'no';
  };

  const adjustServings = (delta: number) => {
    const next = Math.max(MIN_SERVINGS, Math.min(MAX_SERVINGS, servings + delta));
    if (next !== servings) {
      setServings(next);
      setAnimKey((k) => k + 1);
    }
  };

  const setPreset = (n: number) => {
    if (n !== servings) {
      setServings(n);
      setAnimKey((k) => k + 1);
    }
  };

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), 280);
  };

  const relatedRecipes = useMemo(() => {
    return allMatches
      .filter((m) => m.recipe.id !== recipe.id)
      .slice(0, 8);
  }, [allMatches, recipe.id]);

  const scrollBy = (dir: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir * 360,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      <style>{styles}</style>

      <div
        className="rd-backdrop"
        onClick={handleClose}
        style={{
          animation: closing ? 'rd-fadeOut 0.3s ease forwards' : undefined,
        }}
      />

      <div
        className="rd-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={recipe.name}
        tabIndex={-1}
        ref={contentRef}
        style={{
          animation: closing
            ? window.innerWidth >= 900
              ? 'rd-fadeOut 0.3s ease forwards'
              : 'rd-slideUp 0.3s cubic-bezier(0.4, 0, 1, 1) reverse forwards'
            : undefined,
        }}
      >
        <span className="rd-drag-bar" />

        <div className="rd-hero" style={{ background: gradient }}>
          <button
            className="rd-close-btn"
            onClick={handleClose}
            aria-label="关闭"
          >
            ✕
          </button>
          <span className="rd-hero-emoji">{emoji}</span>
          <div className="rd-hero-info">
            <h1 className="rd-hero-name">{recipe.name}</h1>
            <div className="rd-hero-meta">
              <span
                className="rd-pill time"
                style={{ ['--pill-color' as any]: timeColor + 'CC' }}
              >
                ⏱ {recipe.cookTime} 分钟
              </span>
              <span className="rd-pill">👥 {recipe.servings} 人份</span>
              <span className="rd-pill">
                📋 {recipe.steps.length} 步骤
              </span>
            </div>
          </div>
        </div>

        <div className="rd-content">
          <div className="rd-section">
            <h2 className="rd-section-title">份量调整</h2>
            <div className="rd-serving-bar">
              <span className="rd-serving-label">食用人数</span>
              <button
                className="rd-serving-btn"
                onClick={() => adjustServings(-1)}
                disabled={servings <= MIN_SERVINGS}
              >
                −
              </button>
              <span className="rd-serving-value">{servings} 人</span>
              <button
                className="rd-serving-btn"
                onClick={() => adjustServings(1)}
                disabled={servings >= MAX_SERVINGS}
              >
                +
              </button>
              <div className="rd-serving-preset">
                {[1, 2, 3, 4, 6].map((n) => (
                  <button
                    key={n}
                    className={`preset-btn ${servings === n ? 'active' : ''}`}
                    onClick={() => setPreset(n)}
                  >
                    {n}人
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rd-section">
            <h2 className="rd-section-title">所需食材</h2>
            <div className="rd-ingredient-grid">
              {scaledIngredients.map((ing, idx) => {
                const match = ingredientMatched(ing.name);
                return (
                  <div
                    key={`${ing.name}-${idx}`}
                    className={`rd-ing-row ${match === 'ok' ? 'matched' : 'missing'}`}
                    style={{
                      opacity: mounted ? 1 : 0,
                      transform: mounted
                        ? 'translateY(0)'
                        : 'translateY(8px)',
                      transition: `opacity 0.4s ease ${idx * 0.03}s,
                                  transform 0.4s cubic-bezier(0.22,1,0.36,1) ${idx * 0.03}s,
                                  box-shadow 0.2s ease, border-color 0.2s ease`,
                    }}
                  >
                    <span className="rd-ing-name">
                      <span className={`dot ${match}`} />
                      {ing.name}
                    </span>
                    <span key={`q-${animKey}-${idx}`} className="rd-ing-qty anim">
                      {formatQty(ing.quantity)} {ing.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rd-section">
            <h2 className="rd-section-title">烹饪步骤</h2>
            <div className="rd-steps-list">
              {recipe.steps.map((step, idx) => (
                <div
                  key={step.order}
                  className="rd-step-item"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted
                      ? 'translateX(0)'
                      : 'translateX(-16px)',
                    transition: `opacity 0.5s ease ${0.1 + idx * 0.06}s,
                                transform 0.5s cubic-bezier(0.22,1,0.36,1) ${0.1 + idx * 0.06}s`,
                  }}
                >
                  <div className="rd-step-num">{step.order}</div>
                  <div className="rd-step-desc">{step.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rd-related">
          <div className="rd-related-header">
            <h2 className="rd-section-title" style={{ marginBottom: 0 }}>
              相关推荐
            </h2>
          </div>

          {relatedRecipes.length === 0 ? (
            <div className="rd-no-related">暂无其他推荐菜谱</div>
          ) : (
            <div className="rd-scroll-wrap">
              <button
                className="rd-arrow-btn left"
                onClick={() => scrollBy(-1)}
                aria-label="向左"
              >
                ‹
              </button>
              <div className="rd-scroll-area" ref={scrollRef}>
                {relatedRecipes.map((m) => {
                  const percent =
                    m.totalCount > 0
                      ? Math.round((m.matchedCount / m.totalCount) * 100)
                      : 0;
                  const g = getGradientTint(m.recipe.imageTint ?? 0);
                  const em =
                    recipeEmojis[
                      (m.recipe.imageTint ?? 0) % recipeEmojis.length
                    ];
                  const tc = getTimeTagColor(m.recipe.cookTime);
                  return (
                    <div
                      key={m.recipe.id}
                      className="rd-mini-card"
                      onClick={() => {
                        handleClose();
                        setTimeout(() => onSelectOther(m.recipe), 300);
                      }}
                    >
                      <div className="rd-mini-img" style={{ background: g }}>
                        <span
                          className="rd-mini-time"
                          style={{ background: tc + 'CC' }}
                        >
                          {m.recipe.cookTime}分
                        </span>
                        {em}
                      </div>
                      <div className="rd-mini-body">
                        <div className="rd-mini-name">{m.recipe.name}</div>
                        <div className="rd-mini-match">
                          <div
                            className="rd-mini-match-fill"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                className="rd-arrow-btn right"
                onClick={() => scrollBy(1)}
                aria-label="向右"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RecipeDetail;
