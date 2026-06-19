import React, { useMemo, useState, useEffect } from 'react';
import {
  MatchResult,
  getTimeTagColor,
  getGradientTint,
  Ingredient,
  Recipe,
} from './data';

interface Props {
  matches: MatchResult[];
  onSelectRecipe: (recipe: Recipe) => void;
}

const styles = `
  .recipe-search-wrap {
    position: relative;
    margin-bottom: 24px;
  }

  .recipe-search {
    width: 100%;
    max-width: 480px;
    padding: 12px 16px 12px 44px;
    font-size: 15px;
    border: 2px solid rgba(139, 69, 19, 0.12);
    border-radius: 14px;
    background: #fff;
    color: #3E2723;
    outline: none;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .recipe-search:focus {
    border-color: #F97316;
    box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12);
  }

  .recipe-search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    opacity: 0.5;
    pointer-events: none;
  }

  .masonry {
    column-count: 4;
    column-gap: 20px;
  }

  @media (max-width: 1200px) {
    .masonry { column-count: 3; }
  }

  @media (max-width: 768px) {
    .masonry {
      column-count: 1;
      column-gap: 14px;
    }
  }

  @media (min-width: 769px) and (max-width: 900px) {
    .masonry { column-count: 2; }
  }

  .recipe-card {
    break-inside: avoid;
    margin-bottom: 20px;
    background: #fff;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(139, 69, 19, 0.08);
    cursor: pointer;
    transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    border: 1px solid rgba(139, 69, 19, 0.06);
    display: inline-block;
    width: 100%;
  }

  @media (min-width: 769px) {
    .recipe-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 18px 40px rgba(139, 69, 19, 0.16),
                  0 8px 18px rgba(139, 69, 19, 0.08);
      border-color: rgba(249, 115, 22, 0.25);
    }
  }

  .recipe-card:active {
    transform: translateY(-4px) scale(0.99);
    transition-duration: 0.1s;
  }

  .card-image {
    width: 100%;
    aspect-ratio: 4 / 3;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .card-image::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), transparent 50%),
      radial-gradient(circle at 70% 80%, rgba(0,0,0,0.08), transparent 45%);
    pointer-events: none;
  }

  .card-emoji {
    font-size: 72px;
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
  }

  .card-time-tag {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 5px 12px;
    border-radius: 999px;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    backdrop-filter: blur(8px);
    z-index: 2;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .card-body {
    padding: 16px 18px 18px;
  }

  .card-name {
    font-size: 18px;
    font-weight: 700;
    color: #3E2723;
    margin-bottom: 12px;
    line-height: 1.3;
  }

  @media (max-width: 768px) {
    .card-body {
      padding: 12px 14px 14px;
    }
    .card-name {
      font-size: 16px;
      margin-bottom: 10px;
    }
  }

  .match-bar-container {
    margin-bottom: 10px;
  }

  .match-bar-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    margin-bottom: 6px;
    color: #8D6E63;
    font-weight: 500;
  }

  .match-bar-label .count {
    font-weight: 600;
    color: #5D4037;
  }

  .match-bar {
    width: 100%;
    height: 8px;
    background: rgba(139, 69, 19, 0.08);
    border-radius: 999px;
    overflow: hidden;
  }

  .match-bar-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #EF4444 0%, #F97316 50%, #22C55E 100%);
    background-size: 200% 100%;
    transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    position: relative;
  }

  .match-bar-fill::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(255,255,255,0.2), transparent 60%);
    pointer-events: none;
  }

  .card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
  }

  .ing-chip {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 500;
    line-height: 1.6;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ing-chip.matched {
    background: rgba(34, 197, 94, 0.12);
    color: #15803D;
  }

  .ing-chip.missing {
    background: rgba(239, 68, 68, 0.1);
    color: #B91C1C;
  }

  .empty-state {
    text-align: center;
    padding: 80px 20px;
    color: #A1887F;
  }

  .empty-emoji {
    font-size: 64px;
    margin-bottom: 16px;
    display: block;
  }

  .empty-title {
    font-size: 18px;
    font-weight: 600;
    color: #6D4C41;
    margin-bottom: 6px;
  }

  .empty-desc {
    font-size: 14px;
  }
`;

const recipeEmojis = ['🍳', '🥘', '🍲', '🥗', '🍜', '🍛', '🥙', '🍱', '🥟', '🍤'];

const RecipeList: React.FC<Props> = ({ matches, onSelectRecipe }) => {
  const [searchText, setSearchText] = useState('');

  const filtered = useMemo(() => {
    const t0 = performance.now();
    const q = searchText.trim().toLowerCase();
    const result = q
      ? matches.filter((m) => {
          const recipeName = m.recipe.name.toLowerCase();
          const ingMatch = m.recipe.ingredients.some((i) =>
            i.name.toLowerCase().includes(q)
          );
          return recipeName.includes(q) || ingMatch;
        })
      : matches;
    const elapsed = performance.now() - t0;
    if (elapsed > 80) {
      console.warn(`Search took ${elapsed.toFixed(1)}ms`);
    }
    return result;
  }, [matches, searchText]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  if (matches.length === 0) {
    return (
      <>
        <style>{styles}</style>
        <div className="empty-state">
          <span className="empty-emoji">🥣</span>
          <div className="empty-title">正在加载菜谱...</div>
          <div className="empty-desc">请稍候</div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <div className="recipe-search-wrap">
        <span className="recipe-search-icon">🔍</span>
        <input
          type="text"
          className="recipe-search"
          placeholder="搜索菜谱名或食材..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-emoji">🔎</span>
          <div className="empty-title">没有找到匹配的菜谱</div>
          <div className="empty-desc">试试换个关键词搜索吧</div>
        </div>
      ) : (
        <div className="masonry">
          {filtered.map((m, idx) => {
            const ratio = m.totalCount > 0 ? m.matchedCount / m.totalCount : 0;
            const percent = Math.round(ratio * 100);
            const timeColor = getTimeTagColor(m.recipe.cookTime);
            const gradient = getGradientTint(m.recipe.imageTint ?? idx);
            const emoji =
              recipeEmojis[(m.recipe.imageTint ?? idx) % recipeEmojis.length];
            const delay = (idx % 20) * 0.03;

            return (
              <div
                key={m.recipe.id}
                className="recipe-card"
                style={{
                  animationDelay: `${delay}s`,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity 0.5s ease ${delay}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s, box-shadow 0.35s ease, border-color 0.35s ease`,
                }}
                onClick={() => onSelectRecipe(m.recipe)}
              >
                <div
                  className="card-image"
                  style={{ background: gradient }}
                >
                  <span
                    className="card-time-tag"
                    style={{ background: timeColor + 'CC' }}
                  >
                    ⏱ {m.recipe.cookTime}分钟
                  </span>
                  <span className="card-emoji">{emoji}</span>
                </div>

                <div className="card-body">
                  <h3 className="card-name">{m.recipe.name}</h3>

                  <div className="match-bar-container">
                    <div className="match-bar-label">
                      <span>食材匹配度</span>
                      <span className="count">
                        {m.matchedCount}/{m.totalCount} · {percent}%
                      </span>
                    </div>
                    <div className="match-bar">
                      <div
                        className="match-bar-fill"
                        style={{
                          width: mounted ? `${percent}%` : '0%',
                          backgroundPosition: `${100 - percent}% 0`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="card-meta">
                    {m.matchedNames.slice(0, 3).map((name) => (
                      <span key={`m-${name}`} className="ing-chip matched">
                        ✓ {name}
                      </span>
                    ))}
                    {m.missingNames.slice(0, 2).map((name) => (
                      <span key={`x-${name}`} className="ing-chip missing">
                        · {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default RecipeList;
