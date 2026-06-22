/**
 * ============================================================
 *  MealLogList.tsx - 餐食日志卡片列表组件
 * ============================================================
 * 
 * 【职责】：
 *  1. 以卡片列表形式展示当日所有餐食记录
 *  2. 每张卡片：餐次图标 + 食物名称+份量 + 热量数值
 *  3. 点击卡片：展开/收起详细营养素拆分(箭头旋转300ms)
 *  4. 新卡片：从右侧滑入动画 + pulse高亮
 *  5. 支持删除单条记录
 * 
 * 【调用关系】：
 *  ┌──────────────────────────────────────────────────┐
 *  │   App.tsx (父组件)                               │
 *  │     │                                            │
 *  │     ▼ 传入 props                                  │
 *  │  ┌─ meals: MealEntry[] (含isNew标记)             │
 *  │  └─ onDeleteMeal(mealId: string) 回调            │
 *  │          │                                       │
 *  │          ▼ useMemo / map 渲染                     │
 *  │  遍历 meals → 每张 meal-card                     │
 *  │    ├─ className: isNew → slideInRight + pulse    │
 *  │    ├─ 点击展开 → 切换 expandedId state           │
 *  │    │     └─ expand-arrow 旋转(0→180deg, 300ms)  │
 *  │    │     └─ meal-details max-height 过渡         │
 *  │    ├─ 删除按钮 → onDeleteMeal(e, mealId)         │
 *  │    │     └─ e.stopPropagation() 防冒泡          │
 *  │    └─ 图标/标签 → 调用工具函数                   │
 *  │         ├─ getMealTypeIcon(type)  🌅☀️🌙🍎       │
 *  │         └─ getMealTypeLabel(type) 早/午/晚/加   │
 *  │                  from '../utils/calculateNutrients'│
 *  └──────────────────────────────────────────────────┘
 * 
 * 【数据流向】：
 *  App props meals[] → 本地 expandedId 状态
 *    → 过滤/展开判断 → 渲染 meal-card 列表
 *    → 详情展开显示 4 项营养素网格(热量/蛋白质/脂肪/碳水)
 * ============================================================
 */

import { memo, useState, useCallback } from 'react';
import type { MealEntry } from '../types';
import { getMealTypeLabel, getMealTypeIcon } from '../utils/calculateNutrients';

interface MealLogListProps {
  meals: MealEntry[];
  onDeleteMeal: (mealId: string) => void;
}

function MealLogList({ meals, onDeleteMeal }: MealLogListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCardClick = useCallback((mealId: string) => {
    setExpandedId(prev => prev === mealId ? null : mealId);
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent, mealId: string) => {
    e.stopPropagation();
    onDeleteMeal(mealId);
  }, [onDeleteMeal]);

  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'ripple';
    ripple.style.background = 'rgba(244, 67, 54, 0.3)';
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);

  if (meals.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📝</div>
        <div className="empty-state-text">还没有饮食记录，快来添加吧！</div>
      </div>
    );
  }

  return (
    <div className="meal-logs">
      {meals.map(meal => (
        <div
          key={meal.id}
          className={`meal-card ${meal.isNew ? 'is-new' : ''}`}
          onClick={() => handleCardClick(meal.id)}
        >
          <div className="meal-card-header">
            <div className="meal-card-left">
              <div className="meal-icon">
                {getMealTypeIcon(meal.mealType)}
              </div>
              <div className="meal-info">
                <div className="meal-type">{getMealTypeLabel(meal.mealType)}</div>
                <div className="meal-name">{meal.foodName} · {meal.grams}g</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div>
                <span className="meal-calories">{Math.round(meal.calories)}</span>
                <span className="meal-calories-unit"> kcal</span>
              </div>
              <span 
                className={`expand-arrow ${expandedId === meal.id ? 'expanded' : ''}`}
              >
                ▼
              </span>
              <button
                className="delete-btn"
                onClick={(e) => { handleDelete(e, meal.id); createRipple(e); }}
                title="删除记录"
              >
                ×
              </button>
            </div>
          </div>

          <div className={`meal-details ${expandedId === meal.id ? 'expanded' : ''}`}>
            <div className="nutrient-grid">
              <div className="nutrient-item">
                <div className="label">🔥 热量</div>
                <div className="value">{meal.calories.toFixed(1)}<span className="unit"> kcal</span></div>
              </div>
              <div className="nutrient-item">
                <div className="label">💪 蛋白质</div>
                <div className="value">{meal.protein.toFixed(1)}<span className="unit"> g</span></div>
              </div>
              <div className="nutrient-item">
                <div className="label">🥑 脂肪</div>
                <div className="value">{meal.fat.toFixed(1)}<span className="unit"> g</span></div>
              </div>
              <div className="nutrient-item">
                <div className="label">🍞 碳水</div>
                <div className="value">{meal.carbs.toFixed(1)}<span className="unit"> g</span></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(MealLogList);
