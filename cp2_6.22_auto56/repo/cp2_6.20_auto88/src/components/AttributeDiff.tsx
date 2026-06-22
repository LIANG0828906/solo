// ============================================================
// 属性差值预览组件 AttributeDiff.tsx
// 职责: 展示合成后装备预估属性与原属性的差值对比
//       绿色+上箭头表示增益, 红色-下箭头表示减益
//       数值变化时有上升/下降动画
// 数据来源: useCrafting -> store.preview.attributeDiff + originalAttributes
//           (由CraftingPanel传入)
// ============================================================

import { memo, useMemo } from 'react';
import type { AttributeKey } from '../types';

interface Props {
  original: Record<AttributeKey, number>;
  diff: Record<AttributeKey, number>;
}

const ATTR_META: { key: AttributeKey; label: string; icon: string }[] = [
  { key: 'attack',     label: '攻击力', icon: '⚔️' },
  { key: 'defense',    label: '防御力', icon: '🛡️' },
  { key: 'magic',      label: '魔力值', icon: '✨' },
  { key: 'durability', label: '耐久度', icon: '💎' },
];

function AttributeDiffComponent({ original, diff }: Props) {
  const rows = useMemo(() => {
    return ATTR_META.map(({ key, label, icon }) => {
      const orig = original[key] ?? 0;
      const delta = diff[key] ?? 0;
      const newValue = orig + delta;
      return { key, label, icon, orig, delta, newValue };
    });
  }, [original, diff]);

  return (
    <div className="attribute-diff">
      <h4 className="attribute-diff__title">
        <span className="title-icon">📊</span>属性变化预览
      </h4>
      <div className="attribute-diff__grid">
        {rows.map(({ key, label, icon, orig, delta, newValue }) => {
          const isUp = delta > 0;
          const isDown = delta < 0;
          return (
            <div key={key} className="attr-row">
              <div className="attr-row__meta">
                <span className="attr-row__icon">{icon}</span>
                <span className="attr-row__label">{label}</span>
              </div>
              <div className="attr-row__values">
                <span className="attr-row__orig">{orig}</span>
                <span className="attr-row__arrow">→</span>
                <span className={`attr-row__new ${isUp ? 'new--up' : isDown ? 'new--down' : ''}`}>
                  {newValue}
                </span>
                {/* 差值带箭头和动画 */}
                {delta !== 0 && (
                  <span className={`attr-row__delta delta-animate ${isUp ? 'delta--up' : 'delta--down'}`}>
                    {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{delta}
                  </span>
                )}
              </div>
              {/* 进度条可视化属性占比 (0-100) */}
              <div className="attr-row__bar">
                <div
                  className={`attr-row__bar-fill ${isUp ? 'bar--up' : isDown ? 'bar--down' : ''}`}
                  style={{ width: `${Math.min(100, newValue)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const AttributeDiff = memo(AttributeDiffComponent);
