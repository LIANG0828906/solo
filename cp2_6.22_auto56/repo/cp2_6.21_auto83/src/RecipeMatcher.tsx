import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  INGREDIENTS,
  Ingredient,
  Recipe,
  CookMethod,
  COOK_METHODS,
  TimePreference,
  fuzzySearchIngredient,
  matchRecipes,
  getRecipeVariant,
} from './utils/recipeData';

const MAX_TAGS = 8;
const DEFAULT_STEP_SECONDS = 5 * 60;

const TIME_PREF_LABELS: Record<TimePreference, { label: string; desc: string; icon: string }> = {
  fast: { label: '偏快', desc: '优先推荐快手食谱', icon: '⚡' },
  medium: { label: '适中', desc: '速度与美味兼顾', icon: '🍽️' },
  slow: { label: '偏慢', desc: '慢工出细活的味道', icon: '🔥' },
};

function CircularTimer({
  seconds,
  totalSeconds,
  isRunning,
  size = 120,
  strokeWidth = 8,
}: {
  seconds: number;
  totalSeconds: number;
  isRunning: boolean;
  size?: number;
  strokeWidth?: number;
}) {
  const pct = seconds / totalSeconds;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - pct);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0,
    }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#F0E6DD"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#timerGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        <defs>
          <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="#FFB347" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
        <span style={{
          fontSize: 10,
          color: 'var(--text-light)',
          marginTop: 2,
          fontWeight: 500,
        }}>
          {isRunning ? '计时中' : seconds === 0 ? '已完成' : '已暂停'}
        </span>
      </div>
    </div>
  );
}

function PrefModal({
  open,
  value,
  onClose,
  onChange,
}: {
  open: boolean;
  value: TimePreference;
  onClose: () => void;
  onChange: (v: TimePreference) => void;
}) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        backdropFilter: 'blur(2px)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 16,
          padding: 24,
          width: 'min(92vw, 360px)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          animation: 'scaleIn 0.25s ease',
        }}
      >
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          ⏱️ 烹饪时间偏好
        </div>
        <div style={{
          fontSize: 13,
          color: 'var(--text-light)',
          marginBottom: 18,
          lineHeight: 1.6,
        }}>
          选择您喜欢的烹饪节奏，系统会优先推荐匹配的食谱
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {(Object.keys(TIME_PREF_LABELS) as TimePreference[]).map((k) => {
            const info = TIME_PREF_LABELS[k];
            const active = value === k;
            return (
              <button
                key={k}
                onClick={() => onChange(k)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: `2px solid ${active ? 'var(--coral)' : 'var(--border)'}`,
                  background: active ? 'linear-gradient(90deg, #FFF0F0, #FFFAF0)' : 'white',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 26 }}>{info.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: active ? 700 : 600,
                    fontSize: 15,
                    color: active ? 'var(--coral)' : 'var(--text)',
                  }}>
                    {info.label}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--text-light)',
                    marginTop: 2,
                  }}>
                    {info.desc}
                  </div>
                </div>
                <span style={{
                  width: 22, height: 22,
                  borderRadius: '50%',
                  background: active ? 'var(--coral)' : '#F0E6DD',
                  color: 'white',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}>
                  {active ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: 12 }}
          onClick={onClose}
        >
          确认设置
        </button>
      </div>
    </div>
  );
}

export default function RecipeMatcher() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Ingredient[]>([]);
  const [cookMethod, setCookMethod] = useState<CookMethod>('炒');
  const [timePreference, setTimePreference] = useState<TimePreference>('medium');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [hasMatched, setHasMatched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [prefModalOpen, setPrefModalOpen] = useState(false);

  const [stepStates, setStepStates] = useState<Record<string, {
    currentStep: number;
    seconds: number;
    isRunning: boolean;
  }>>({});

  const timerRefs = useRef<Record<string, ReturnType<typeof setInterval> | null>>({});

  const suggestions = useMemo(() => fuzzySearchIngredient(query), [query]);

  useEffect(() => {
    const initials = ['鸡胸肉', '西兰花', '鸡蛋'].map(
      (n) => INGREDIENTS.find((i) => i.name === n)!
    ).filter(Boolean);
    setSelected(initials.slice(0, 3));
    setRecipes(matchRecipes(initials.map((i) => i.name), '炒', 'medium'));
    setHasMatched(true);
  }, []);

  const startTimer = useCallback((recipeId: string, variantIdx: number) => {
    const key = `${recipeId}-${variantIdx}`;
    if (timerRefs.current[key]) return;
    const timer = setInterval(() => {
      setStepStates((prev) => {
        const s = prev[key];
        if (!s || !s.isRunning || s.seconds <= 0) return prev;
        return {
          ...prev,
          [key]: { ...s, seconds: Math.max(0, s.seconds - 1) },
        };
      });
    }, 1000);
    timerRefs.current[key] = timer;
  }, []);

  const stopTimer = useCallback((key: string) => {
    if (timerRefs.current[key]) {
      clearInterval(timerRefs.current[key]!);
      timerRefs.current[key] = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach((t) => { if (t) clearInterval(t); });
    };
  }, []);

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
    setRecipes(matchRecipes(names, cookMethod, timePreference));
    setHasMatched(true);
    setExpandedId(null);
  };

  const onCookChange = (m: CookMethod) => {
    setCookMethod(m);
    setExpandedId(null);
    if (hasMatched) {
      const names = selected.map((i) => i.name);
      setRecipes(matchRecipes(names, m, timePreference));
    }
  };

  const onPrefChange = (v: TimePreference) => {
    setTimePreference(v);
    if (hasMatched) {
      const names = selected.map((i) => i.name);
      setRecipes(matchRecipes(names, cookMethod, v));
    }
  };

  const toggleExpand = (recipeId: string, variantIdx: number) => {
    const isExpanding = expandedId !== recipeId;
    setExpandedId(isExpanding ? recipeId : null);

    if (isExpanding) {
      const key = `${recipeId}-${variantIdx}`;
      if (!stepStates[key]) {
        setStepStates((prev) => ({
          ...prev,
          [key]: { currentStep: 0, seconds: DEFAULT_STEP_SECONDS, isRunning: true },
        }));
      } else {
        setStepStates((prev) => ({
          ...prev,
          [key]: { ...prev[key], isRunning: true },
        }));
      }
      setTimeout(() => startTimer(recipeId, variantIdx), 300);
    }
  };

  const togglePause = (recipeId: string, variantIdx: number) => {
    const key = `${recipeId}-${variantIdx}`;
    setStepStates((prev) => {
      if (!prev[key]) return prev;
      const running = !prev[key].isRunning;
      if (running) {
        setTimeout(() => startTimer(recipeId, variantIdx), 0);
      } else {
        stopTimer(key);
      }
      return { ...prev, [key]: { ...prev[key], isRunning: running } };
    });
  };

  const goNextStep = (recipeId: string, variantIdx: number, totalSteps: number) => {
    const key = `${recipeId}-${variantIdx}`;
    setStepStates((prev) => {
      const s = prev[key];
      if (!s) return prev;
      const nextStep = Math.min(totalSteps - 1, s.currentStep + 1);
      return {
        ...prev,
        [key]: { ...s, currentStep: nextStep, seconds: DEFAULT_STEP_SECONDS, isRunning: true },
      };
    });
    if (stepStates[key]?.currentStep! >= totalSteps - 1) return;
    startTimer(recipeId, variantIdx);
  };

  const skipStep = (recipeId: string, variantIdx: number, totalSteps: number) => {
    goNextStep(recipeId, variantIdx, totalSteps);
  };

  const resetStep = (recipeId: string, variantIdx: number) => {
    const key = `${recipeId}-${variantIdx}`;
    setStepStates((prev) => ({
      ...prev,
      [key]: { currentStep: 0, seconds: DEFAULT_STEP_SECONDS, isRunning: true },
    }));
    startTimer(recipeId, variantIdx);
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

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
      }}>
        <div style={{
          fontSize: 12,
          color: 'var(--text-light)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 500,
        }}>
          <span style={{
            background: TIME_PREF_LABELS[timePreference].label === '偏快' ? '#FFE0B3' : 
              TIME_PREF_LABELS[timePreference].label === '适中' ? '#FFD0D0' : '#C5DEA1',
            color: TIME_PREF_LABELS[timePreference].label === '偏慢' ? 'var(--matcha-dark)' : '#8B5E00',
            padding: '2px 10px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 11,
          }}>
            {TIME_PREF_LABELS[timePreference].icon} {TIME_PREF_LABELS[timePreference].label}
          </span>
          <span style={{ color: 'var(--text-lighter)' }}>时间偏好</span>
        </div>
        <button
          onClick={() => setPrefModalOpen(true)}
          style={{
            fontSize: 12,
            color: 'var(--coral)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: 8,
            background: '#FFF0F0',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#FFE0E0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#FFF0F0'; }}
        >
          ⚙️ 偏好设置
        </button>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
        onClick={handleMatch}
      >
        🍳 为我匹配食谱
      </button>

      {!hasMatched ? (
        <div className="empty-hint">
          <div className="big">🍴</div>
          添加食材后点击上方按钮，系统将为您推荐合适的食谱
        </div>
      ) : (
        <>
          {recipes.map((r, rIdx) => {
            const variant = getRecipeVariant(r, cookMethod);
            const open = expandedId === r.id;
            const selSet = new Set(selected.map((s) => s.name));
            const stateKey = `${r.id}-${rIdx}`;
            const state = stepStates[stateKey] || { currentStep: 0, seconds: DEFAULT_STEP_SECONDS, isRunning: false };
            const currentStepIdx = state.currentStep;
            const totalSteps = variant.steps.length;
            const step = variant.steps[currentStepIdx];

            return (
              <div
                key={r.id}
                className="recipe-card"
                style={{
                  overflow: 'hidden',
                }}
              >
                <div
                  className="rc-header"
                  onClick={() => toggleExpand(r.id, rIdx)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="rc-info">
                    <h3>{r.name}</h3>
                    <p>{r.description}</p>
                  </div>
                  <div className="rc-meta">
                    <span className="rc-badge">{r.difficulty}</span>
                    <span className="rc-time">⏱ {variant.cookTimeMin}分钟</span>
                  </div>
                </div>
                <div className="rc-ing" onClick={() => toggleExpand(r.id, rIdx)} style={{ cursor: 'pointer' }}>
                  {r.ingredients.map((i) => (
                    <span key={i} className={selSet.has(i) ? 'match' : ''}>
                      {selSet.has(i) ? '✓ ' : ''}{i}
                    </span>
                  ))}
                </div>

                <div
                  className={'rc-expand' + (open ? ' open' : '')}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    className="rc-steps"
                    onClick={(e) => e.stopPropagation()}
                    style={{ paddingTop: 16 }}
                  >
                    <div style={{
                      display: 'flex',
                      gap: 18,
                      padding: '12px 0 18px',
                      alignItems: 'flex-start',
                      animation: 'slideDown 0.35s ease backwards',
                    }}>
                      <CircularTimer
                        seconds={state.seconds}
                        totalSeconds={DEFAULT_STEP_SECONDS}
                        isRunning={state.isRunning}
                        size={120}
                        strokeWidth={8}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 10,
                        }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 30, height: 30,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--coral), var(--coral-dark))',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: 14,
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(255,107,107,0.3)',
                          }}>
                            {currentStepIdx + 1}
                          </span>
                          <span style={{
                            fontSize: 12,
                            color: 'var(--text-light)',
                            fontWeight: 500,
                          }}>
                            步骤 {currentStepIdx + 1} / {totalSteps}
                          </span>
                          <div style={{
                            flex: 1,
                            height: 6,
                            background: '#F0E6DD',
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${((currentStepIdx + 1) / totalSteps) * 100}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #FF6B6B, #FFB347)',
                              borderRadius: 3,
                              transition: 'width 0.4s ease',
                            }} />
                          </div>
                        </div>

                        <div style={{
                          fontSize: 14,
                          lineHeight: 1.7,
                          color: 'var(--text)',
                          fontWeight: 500,
                          marginBottom: 14,
                          minHeight: 48,
                        }}>
                          {step?.description}
                        </div>

                        <div style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}>
                          <button
                            onClick={() => togglePause(r.id, rIdx)}
                            className="btn"
                            style={{
                              padding: '7px 16px',
                              fontSize: 12,
                              fontWeight: 600,
                              background: state.isRunning ? '#FFF0F0' : '#F0F8E8',
                              color: state.isRunning ? 'var(--coral)' : 'var(--matcha-dark)',
                              borderRadius: 20,
                            }}
                          >
                            {state.isRunning ? '⏸ 暂停' : '▶ 继续'}
                          </button>
                          <button
                            onClick={() => skipStep(r.id, rIdx, totalSteps)}
                            disabled={currentStepIdx >= totalSteps - 1}
                            className="btn"
                            style={{
                              padding: '7px 16px',
                              fontSize: 12,
                              fontWeight: 600,
                              background: 'var(--bg-alt)',
                              color: currentStepIdx >= totalSteps - 1 ? 'var(--text-lighter)' : 'var(--text)',
                              borderRadius: 20,
                              cursor: currentStepIdx >= totalSteps - 1 ? 'not-allowed' : 'pointer',
                            }}
                          >
                            ⏭ 跳过
                          </button>
                          {currentStepIdx < totalSteps - 1 ? (
                            <button
                              onClick={() => goNextStep(r.id, rIdx, totalSteps)}
                              className="btn btn-primary"
                              style={{
                                padding: '7px 18px',
                                fontSize: 12,
                                fontWeight: 600,
                                marginLeft: 'auto',
                              }}
                            >
                              下一步 →
                            </button>
                          ) : (
                            <button
                              onClick={() => resetStep(r.id, rIdx)}
                              className="btn btn-matcha"
                              style={{
                                padding: '7px 18px',
                                fontSize: 12,
                                fontWeight: 600,
                                marginLeft: 'auto',
                              }}
                            >
                              ✓ 完成 · 再来一次
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: 6,
                      marginTop: 6,
                      padding: '10px 0 0',
                      borderTop: '1px dashed var(--border)',
                      flexWrap: 'wrap',
                    }}>
                      {variant.steps.map((_, idx) => {
                        const status =
                          idx < currentStepIdx ? 'done' :
                          idx === currentStepIdx ? 'current' : 'upcoming';
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setStepStates((prev) => ({
                                ...prev,
                                [stateKey]: {
                                  currentStep: idx,
                                  seconds: DEFAULT_STEP_SECONDS,
                                  isRunning: true,
                                },
                              }));
                              startTimer(r.id, rIdx);
                            }}
                            style={{
                              width: 28, height: 28,
                              borderRadius: '50%',
                              border: 'none',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              background:
                                status === 'done' ? 'var(--matcha)' :
                                status === 'current' ? 'linear-gradient(135deg, #FF6B6B, #FFB347)' :
                                '#F0E6DD',
                              color: status === 'upcoming' ? 'var(--text-lighter)' : 'white',
                              boxShadow: status === 'current' ? '0 2px 8px rgba(255,107,107,0.3)' : 'none',
                              transform: status === 'current' ? 'scale(1.15)' : 'scale(1)',
                            }}
                            title={`跳转到第 ${idx + 1} 步`}
                          >
                            {status === 'done' ? '✓' : idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      <PrefModal
        open={prefModalOpen}
        value={timePreference}
        onClose={() => setPrefModalOpen(false)}
        onChange={onPrefChange}
      />
    </div>
  );
}
