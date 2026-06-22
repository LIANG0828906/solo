import { useMemo, useState } from 'react';
import { useGameStore, computeFlavor } from '../store';
import type { Recipe, RecipeIngredient } from '../types';
import '../styles/recipe-editor.css';

interface SelectedIngredient {
  beanId: string;
  grams: number;
}

export default function RecipeEditor() {
  const beans = useGameStore((s) => s.beans);
  const recipes = useGameStore((s) => s.recipes);
  const addRecipe = useGameStore((s) => s.addRecipe);
  const selectRecipe = useGameStore((s) => s.selectRecipe);
  const selectedRecipeId = useGameStore((s) => s.selectedRecipeId);
  const incrementBrewedCount = useGameStore((s) => s.incrementBrewedCount);

  const [selected, setSelected] = useState<SelectedIngredient[]>([]);
  const [recipeName, setRecipeName] = useState('');
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const toggleBean = (beanId: string) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.beanId === beanId);
      if (exists) {
        return prev.filter((s) => s.beanId !== beanId);
      }
      if (prev.length >= 3) {
        showToast('err', '最多只能选择 3 种豆子');
        return prev;
      }
      return [...prev, { beanId, grams: 25 }];
    });
  };

  const setGrams = (beanId: string, grams: number) => {
    setSelected((prev) =>
      prev.map((s) => (s.beanId === beanId ? { ...s, grams } : s)),
    );
  };

  const flavor = useMemo(() => {
    const ings: { beanId: string; grams: number }[] = selected;
    return computeFlavor(ings, beans);
  }, [selected, beans]);

  const totalGrams = useMemo(
    () => selected.reduce((sum, s) => sum + s.grams, 0),
    [selected],
  );

  const canSave = selected.length > 0 && recipeName.trim().length > 0 && totalGrams >= 10;

  const showToast = (type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2200);
  };

  const handleSave = () => {
    if (!canSave) return;
    const ingredients: RecipeIngredient[] = selected.map((s) => ({
      beanId: s.beanId,
      grams: s.grams,
    }));
    addRecipe({
      name: recipeName.trim(),
      ingredients,
      totalAcid: flavor.acid,
      totalBitter: flavor.bitter,
      totalSweet: flavor.sweet,
      energyKcal: flavor.energy,
    });
    showToast('ok', `配方「${recipeName.trim()}」已保存`);
    setRecipeName('');
    setSelected([]);
  };

  const handleApplyRecipe = (r: Recipe) => {
    const insufficient = r.ingredients.find(
      (ing) => (beans.find((b) => b.id === ing.beanId)?.stockGrams ?? 0) < ing.grams,
    );
    if (insufficient) {
      const bean = beans.find((b) => b.id === insufficient.beanId);
      showToast('err', `${bean?.name ?? '豆子'}库存不足`);
      return;
    }
    selectRecipe(selectedRecipeId === r.id ? null : r.id);
    if (selectedRecipeId !== r.id) {
      incrementBrewedCount(r.id);
    }
  };

  return (
    <div className="recipe-wrap">
      <h2 className="section-title">🧪 配方编辑器</h2>
      <div className="recipe-editor-layout">
        <div className="recipe-left card">
          <div className="editor-title">
            <span>🌱 原料选择</span>
            <span className="bean-count-badge">
              已选 {selected.length} / 3
            </span>
          </div>

          <div className="ingredient-list">
            {beans.map((bean) => {
              const sel = selected.find((s) => s.beanId === bean.id);
              const isSelected = !!sel;
              const disabled = !isSelected && selected.length >= 3;
              return (
                <div
                  key={bean.id}
                  className={`ingredient-item ${isSelected ? 'on' : ''} ${disabled ? 'locked' : ''}`}
                >
                  <label className="ingredient-head">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={disabled}
                      onChange={() => toggleBean(bean.id)}
                    />
                    <span className="ing-emoji">{bean.emoji}</span>
                    <div className="ing-meta">
                      <div className="ing-name">{bean.name}</div>
                      <div className="ing-sub">
                        库存 <strong className={bean.stockGrams < 80 ? 'low' : ''}>{bean.stockGrams}g</strong>
                        <span className="ing-dot">·</span>
                        {bean.roastLevel}
                      </div>
                    </div>
                  </label>
                  {isSelected && (
                    <div className="ing-slider-wrap">
                      <div className="ing-slider-row">
                        <span className="slider-label">用量</span>
                        <input
                          type="range"
                          min={10}
                          max={50}
                          step={1}
                          value={sel!.grams}
                          onChange={(e) => setGrams(bean.id, Number(e.target.value))}
                        />
                        <span className="slider-num">{sel!.grams}g</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="save-recipe-wrap">
            <input
              type="text"
              className="recipe-name-input"
              placeholder="给配方起个名字，比如：早安拿铁..."
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              maxLength={16}
            />
            <button
              className="save-recipe-btn"
              disabled={!canSave}
              onClick={handleSave}
            >
              💾 保存配方
            </button>
          </div>
        </div>

        <div className="recipe-right card">
          <div className="editor-title">
            <span>📊 风味预览</span>
            {totalGrams > 0 && (
              <span className="bean-count-badge good">总用量 {totalGrams}g</span>
            )}
          </div>

          <div className="flavor-preview">
            <FlavorBar
              label="酸度"
              value={flavor.acid}
              color="acid"
              icon="🍋"
            />
            <FlavorBar
              label="苦度"
              value={flavor.bitter}
              color="bitter"
              icon="🍫"
            />
            <FlavorBar
              label="甜度"
              value={flavor.sweet}
              color="sweet"
              icon="🍯"
            />

            <div className="energy-row">
              <div className="energy-label">
                <span className="energy-icon">🔥</span>
                能量值
              </div>
              <div className="energy-value">
                <strong>{flavor.energy}</strong>
                <span>kcal / 杯</span>
              </div>
            </div>

            <div className="total-score-row">
              <div className="score-label">综合评分</div>
              <div className="score-ring">
                <svg viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="var(--color-secondary-light)"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="var(--color-primary)"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${Math.round(((flavor.acid + flavor.bitter + flavor.sweet) / 300) * 314)} 314`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 0.4s ease' }}
                  />
                </svg>
                <div className="score-num">
                  {Math.round((flavor.acid + flavor.bitter + flavor.sweet) / 3)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="section-title" style={{ marginTop: 28 }}>
        📚 配方库
        {selectedRecipeId && (
          <span className="active-recipe-badge">
            已选中 1 个配方
          </span>
        )}
      </h2>

      {recipes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🫙</span>
          还没有配方，快去上方调配你的第一款咖啡吧！
        </div>
      ) : (
        <div className="recipe-library">
          {recipes.map((r) => {
            const ings = r.ingredients
              .map((ing) => {
                const b = beans.find((x) => x.id === ing.beanId);
                return b ? b.name.split(' ')[0] : '';
              })
              .filter(Boolean)
              .join(' + ');
            const isActive = selectedRecipeId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                className={`recipe-card ${isActive ? 'active' : ''}`}
                onClick={() => handleApplyRecipe(r)}
              >
                <div className="recipe-card-top">
                  <span className="rc-emoji">☕</span>
                  {isActive && <span className="rc-check">✓ 已选</span>}
                </div>
                <div className="rc-name">{r.name}</div>
                <div className="rc-ings">{ings}</div>

                <div className="rc-flavors">
                  <Mini label="酸" value={r.totalAcid} color="acid" />
                  <Mini label="苦" value={r.totalBitter} color="bitter" />
                  <Mini label="甜" value={r.totalSweet} color="sweet" />
                </div>

                <div className="rc-footer">
                  <span>🔥 {r.energyKcal} kcal</span>
                  <span>已出杯 {r.brewedCount}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {toast && (
        <div className={`recipe-toast ${toast.type}`}>
          {toast.type === 'ok' ? '✅ ' : '⚠️ '}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function FlavorBar({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: 'acid' | 'bitter' | 'sweet';
  icon: string;
}) {
  return (
    <div className="flavor-row">
      <div className="flavor-row-head">
        <span className="flavor-icon">{icon}</span>
        <span className="flavor-label-text">{label}</span>
        <span className="flavor-num">{value}</span>
      </div>
      <div className="flavor-progress">
        <div
          className={`flavor-progress-fill ${color}-fill`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'acid' | 'bitter' | 'sweet';
}) {
  return (
    <div className="rc-mini">
      <div className="rc-mini-head">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="rc-mini-bar">
        <div className={`rc-mini-fill ${color}-fill`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
