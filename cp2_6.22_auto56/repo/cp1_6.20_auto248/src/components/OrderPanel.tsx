import { useMemo, useState } from 'react';
import { useApp } from '../App';
import type { Dish, DishCategory } from '../types';
import { CATEGORY_LABELS } from '../types';

const CATEGORIES: Array<DishCategory | 'all'> = ['all', 'cold', 'hot', 'staple', 'drink'];
const SPICY_LEVELS: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3];

function renderSpicy(n: number) {
  return '🌶️'.repeat(n);
}
function renderStars(n: number) {
  return '⭐'.repeat(n);
}

function ProgressRing({ count, total }: { count: number; total: number }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  const ratio = total > 0 ? Math.min(count / total, 1) : 0;
  const offset = c * (1 - ratio);
  return (
    <div className="progress-ring-wrap" title={`${count}/${total}人想要`}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2196f3" />
            <stop offset="100%" stopColor="#4caf50" />
          </linearGradient>
        </defs>
        <circle className="progress-ring-bg" cx="22" cy="22" r={r} />
        <circle
          className="progress-ring-fg"
          cx="22"
          cy="22"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-label">{count}</div>
    </div>
  );
}

function DishCard({
  dish,
  count,
  total,
  selected,
  disabled,
  onToggle,
}: {
  dish: Dish;
  count: number;
  total: number;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`dish-card ${selected ? 'selected' : ''}`}
      onClick={() => !disabled && onToggle()}
      style={{ opacity: disabled ? 0.85 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div className="dish-check">✓</div>
      <div className="dish-top">
        <div className="dish-emoji">{dish.emoji}</div>
        <div className="dish-info">
          <div className="dish-name">{dish.name}</div>
          <div className="dish-meta">
            <span title="辣度">{renderSpicy(dish.spiciness) || '🌱'}</span>
            <span title="推荐指数">{renderStars(dish.rating)}</span>
          </div>
          <div className="dish-price">
            ¥{dish.price}
            <small> / 份</small>
          </div>
        </div>
      </div>
      {count > 0 && <ProgressRing count={count} total={total} />}
    </div>
  );
}

export default function OrderPanel() {
  const { state, selectDish } = useApp();
  const [category, setCategory] = useState<DishCategory | 'all'>('all');
  const [spiciness, setSpiciness] = useState<0 | 1 | 2 | 3>(0);

  const memberCount = state.group ? state.group.members.length : 0;
  const currentMember = state.group?.members.find((m) => m.id === state.currentMemberId);
  const selectedIds = new Set(currentMember?.selectedDishIds || []);

  const mergedCountMap = useMemo(() => {
    const m = new Map<string, number>();
    state.merged.forEach((x) => m.set(x.dish.id, x.count));
    return m;
  }, [state.merged]);

  const filtered = useMemo(() => {
    const t0 = performance.now();
    let list = state.dishes;
    if (category !== 'all') list = list.filter((d) => d.category === category);
    if (spiciness !== 0) list = list.filter((d) => d.spiciness === spiciness);
    const t1 = performance.now();
    if (t1 - t0 > 50) console.warn(`[筛选耗时] ${(t1 - t0).toFixed(1)}ms`);
    return list;
  }, [state.dishes, category, spiciness]);

  const disabled = !state.group || !state.currentMemberId;

  return (
    <div className="card">
      <h2 className="section-title">菜品目录</h2>
      <div className="filter-bar">
        <div className="chip-group" role="tablist" aria-label="分类">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`chip ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c === 'all' ? '全部' : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="chip-group" role="tablist" aria-label="辣度">
          {SPICY_LEVELS.map((s) => (
            <button
              key={s}
              className={`chip ${spiciness === s ? 'active' : ''}`}
              onClick={() => setSpiciness(s)}
              title={s === 0 ? '不限辣度' : `辣度${s}`}
            >
              {s === 0 ? '🌶️ 不限' : '🌶️'.repeat(s)}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-soft)' }}>
          共 {filtered.length} 道菜
        </div>
      </div>

      {disabled && (
        <div className="empty-hint" style={{ marginBottom: 16 }}>
          <span className="big">👋</span>
          请先在右侧 <b>创建拼单小组</b> 或 <b>加入小组</b>，然后勾选你想吃的菜品吧！
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-hint">
          <span className="big">🔍</span>
          没有找到符合条件的菜品
        </div>
      ) : (
        <div className="dish-grid">
          {filtered.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              count={mergedCountMap.get(dish.id) || (selectedIds.has(dish.id) ? 1 : 0)}
              total={memberCount || 1}
              selected={selectedIds.has(dish.id)}
              disabled={disabled}
              onToggle={() => selectDish(dish.id, !selectedIds.has(dish.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
