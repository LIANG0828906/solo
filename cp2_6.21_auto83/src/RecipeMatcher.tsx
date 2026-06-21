import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  INGREDIENTS,
  Ingredient,
  Recipe,
  CookMethod,
  COOK_METHODS,
  fuzzySearchIngredient,
  matchRecipes,
  getRecipeVariant,
} from './utils/recipeData';

const MAX_TAGS = 8;

export default function RecipeMatcher() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Ingredient[]>([]);
  const [cookMethod, setCookMethod] = useState<CookMethod>('炒');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [hasMatched, setHasMatched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stepProgress, setStepProgress] = useState<Record<string, number>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = useMemo(() => fuzzySearchIngredient(query), [query]);

  useEffect(() => {
    const initials = ['鸡胸肉', '西兰花', '鸡蛋', '番茄'].map(
      (n) => INGREDIENTS.find((i) => i.name === n)!
    ).filter(Boolean);
    setSelected(initials.slice(0, 3));
    setRecipes(matchRecipes(initials.map((i) => i.name), '炒'));
    setHasMatched(true);
  }, []);

  useEffect(() => {
    if (!expandedId) return;
    const recipe = recipes.find((r) => r.id === expandedId);
    if (!recipe) return;
    const variant = getRecipeVariant(recipe, cookMethod);
    const timers: ReturnType<typeof setInterval>[] = [];
    variant.steps.forEach((step, idx) => {
      const key = `${expandedId}-${idx}`;
      setStepProgress((p) => ({ ...p, [key]: 100 }));
      const totalMs = step.durationSec * 1000;
      const interval = 50;
      const dec = (100 * interval) / totalMs;
      let v = 100;
      const t = setInterval(() => {
        v = Math.max(0, v - dec);
        setStepProgress((p) => ({ ...p, [key]: v }));
        if (v <= 0) clearInterval(t);
      }, interval);
      timers.push(t);
    });
    return () => { timers.forEach((t) => clearInterval(t)); };
  }, [expandedId, cookMethod, recipes]);

  const addIngredient = (ing: Ingredient) => {
    if (selected.find((i) => i.name === ing.name)) return;
    if (selected.length >= MAX_TAGS) return;
    setSelected((s) => [...s, ing]);
    setQuery('');
    setShowSuggestions(false);
  };

  const removeIngredient = (name: string) => {
    setSelected((s) => s.filter((i) => i.name !== name));
  };

  const handleMatch = () => {
    const names = selected.map((i) => i.name);
    setRecipes(matchRecipes(names, cookMethod));
    setHasMatched(true);
    setExpandedId(null);
  };

  const onCookChange = (m: CookMethod) => {
    setCookMethod(m);
    setExpandedId(null);
    if (hasMatched) {
      const names = selected.map((i) => i.name);
      setRecipes(matchRecipes(names, m));
    }
  };

  return (
    <div className="card">
      <div className="card-title">🥑 食材智能匹配</div>

      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          placeholder="输入食材名称，如：鸡胸肉、西兰花..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
          onFocus={() => { setShowSuggestions(true); }}
          onBlur={() => { setTimeout(() => { setShowSuggestions(false); }, 200); }}
        />
        <span className="search-count">{selected.length}/{MAX_TAGS}</span>
        {showSuggestions && query.trim() && suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((s) => (
              <div
                key={s.id + s.name}
                className="suggestion-item"
                onMouseDown={() => addIngredient(s)}
              >
                <span className="emoji">{s.emoji}</span>
                <span style={{ flex: 1, fontWeight: 500 }}>{s.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-lighter)' }}>
                  {selected.find((i) => i.name === s.name) ? '已添加' : '点击添加'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tags">
        {selected.length === 0 && (
          <span style={{ fontSize: 13, color: 'var(--text-lighter)' }}>
            从上方输入框添加食材，最多添加8种
          </span>
        )}
        {selected.map((ing) => (
          <div
            key={ing.name}
            className="tag"
            style={{ background: ing.color + '66', color: 'var(--text)' }}
          >
            <span>{ing.emoji}</span>
            <span>{ing.name}</span>
            <span className="x" onClick={() => removeIngredient(ing.name)}>✕</span>
          </div>
        ))}
      </div>

      <div className="tabs">
        {COOK_METHODS.map((m) => (
          <button
            key={m}
            className={'tab' + (cookMethod === m ? ' active' : '')}
            onClick={() => onCookChange(m)}
          >
            {m}
          </button>
        ))}
      </div>

      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }} onClick={handleMatch}>
        🍳 为我匹配食谱
      </button>

      {!hasMatched ? (
        <div className="empty-hint">
          <div className="big">🍴</div>
          添加食材后点击上方按钮，系统将为您推荐合适的食谱
        </div>
      ) : (
        <>
          {recipes.map((r) => {
            const variant = getRecipeVariant(r, cookMethod);
            const open = expandedId === r.id;
            const selSet = new Set(selected.map((s) => s.name));
            return (
              <div
                key={r.id}
                className="recipe-card"
                onClick={() => setExpandedId(open ? null : r.id)}
              >
                <div className="rc-header">
                  <div className="rc-info">
                    <h3>{r.name}</h3>
                    <p>{r.description}</p>
                  </div>
                  <div className="rc-meta">
                    <span className="rc-badge">{r.difficulty}</span>
                    <span className="rc-time">⏱ {variant.cookTimeMin}分钟</span>
                  </div>
                </div>
                <div className="rc-ing">
                  {r.ingredients.map((i) => (
                    <span key={i} className={selSet.has(i) ? 'match' : ''}>
                      {selSet.has(i) ? '✓ ' : ''}{i}
                    </span>
                  ))}
                </div>
                <div className={'rc-expand' + (open ? ' open' : '')}>
                  <div className="rc-steps">
                    {variant.steps.map((s, idx) => {
                      const key = `${r.id}-${idx}`;
                      const pct = stepProgress[key] ?? 100;
                      const remainSec = Math.max(0, Math.ceil((pct / 100) * s.durationSec));
                      return (
                        <div className="rc-step" key={idx}>
                          <div className="step-num" style={{
                            background: pct <= 0
                              ? 'linear-gradient(135deg, #88B04B, #6E8F3B)'
                              : 'linear-gradient(135deg, #FF6B6B, #E85555)',
                          }}>{s.order}</div>
                          <div className="step-body">
                            <div className="step-text">{s.description}</div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              marginTop: 4,
                            }}>
                              <div className="step-bar" style={{ flex: 1 }}>
                                <div
                                  className="step-fill"
                                  style={{
                                    width: `${pct}%`,
                                    background: pct <= 0
                                      ? 'linear-gradient(90deg, #88B04B, #6BCB77)'
                                      : 'linear-gradient(90deg, #FF6B6B, #FF8E8E)',
                                  }}
                                />
                              </div>
                              <span style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: pct <= 0 ? 'var(--matcha-dark)' : 'var(--coral)',
                                minWidth: 44,
                                textAlign: 'right',
                              }}>
                                {pct <= 0 ? '✓ 完成' : `⏱ ${remainSec}s`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
