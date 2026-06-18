/**
 * ============================================================
 *  GoalSetting.tsx - 营养目标设置组件
 * ============================================================
 * 
 * 【职责】：
 *  1. 提供4项营养目标输入：热量上限、蛋白质下限、脂肪上限、碳水上限
 *  2. 防抖处理(300ms)：避免用户输入过程中频繁触发父组件更新
 *  3. 输入验证：限定合理数值范围
 *  4. 将修改后的目标通过 props 回调同步给 App 全局状态
 * 
 * 【调用关系】：
 *  ┌──────────────────────────────────────────────────┐
 *  │   App.tsx (父组件)                               │
 *  │     │                                            │
 *  │     ▼ 传入 props                                  │
 *  │  ┌─ currentGoals: NutritionGoals                │
 *  │  │   {dailyCalories, minProtein,                │
 *  │  │    maxFat, maxCarbs}  (受控源)               │
 *  │  └─ onUpdateGoals(partial: Partial<Goals>)     │
 *  │          │                                       │
 *  │          ▼ 本地 state: localGoals                │
 *  │   useEffect: currentGoals变化 → 同步localGoals  │
 *  │          │                                       │
 *  │     用户输入 <input onChange>                     │
 *  │          │                                       │
 *  │          ▼ handleChange(field, value)             │
 *  │   1. setLocalGoals → 即时更新输入框显示          │
 *  │   2. clearTimeout(debounceTimer)                 │
 *  │   3. setTimeout(300ms) → 防抖触发回调            │
 *  │          │                                       │
 *  │          ▼ props.onUpdateGoals({ field: value }) │
 *  │          App.tsx setGoals(merge → 新目标)        │
 *  │          │                                       │
 *  │          ▼ 父组件传递给子组件                     │
 *  │     NutrientChart.goalStatus (达标判断)           │
 *  │       → 热量≤上限 / 蛋白质≥下限 / 脂肪≤上限 ... │
 *  └──────────────────────────────────────────────────┘
 * 
 * 【数据流向】：
 *  App currentGoals → 本地 localGoals (显示用)
 *    → 用户输入 → 300ms防抖 → onUpdateGoals 回调
 *    → App.setGoals → 新goals props流入NutrientChart
 *    → goalStatus重新计算 → 达标UI更新
 * ============================================================
 */

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import type { NutritionGoals } from '../types';

interface GoalSettingProps {
  currentGoals: NutritionGoals;
  onUpdateGoals: (goals: Partial<NutritionGoals>) => void;
}

function GoalSetting({ currentGoals, onUpdateGoals }: GoalSettingProps) {
  const [localGoals, setLocalGoals] = useState(currentGoals);
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalGoals(currentGoals);
  }, [currentGoals]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleChange = useCallback((field: keyof NutritionGoals, value: string) => {
    const numValue = parseFloat(value) || 0;
    setLocalGoals(prev => ({ ...prev, [field]: numValue }));

    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      onUpdateGoals({ [field]: numValue });
    }, 300);
  }, [onUpdateGoals]);

  const goalInputs = [
    { 
      key: 'dailyCalories' as const, 
      label: '每日热量上限', 
      unit: 'kcal',
      placeholder: '2000',
      min: 500,
      max: 5000,
    },
    { 
      key: 'minProtein' as const, 
      label: '蛋白质下限', 
      unit: 'g',
      placeholder: '60',
      min: 10,
      max: 300,
    },
    { 
      key: 'maxFat' as const, 
      label: '脂肪上限', 
      unit: 'g',
      placeholder: '65',
      min: 10,
      max: 200,
    },
    { 
      key: 'maxCarbs' as const, 
      label: '碳水上限', 
      unit: 'g',
      placeholder: '250',
      min: 20,
      max: 500,
    },
  ];

  return (
    <div className="goal-setting">
      <div className="goal-inputs">
        {goalInputs.map(input => (
          <div key={input.key} className="goal-input-group">
            <label htmlFor={input.key}>{input.label}</label>
            <input
              id={input.key}
              type="number"
              value={localGoals[input.key]}
              onChange={(e) => handleChange(input.key, e.target.value)}
              placeholder={input.placeholder}
              min={input.min}
              max={input.max}
              step="1"
            />
            <span style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
              {input.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(GoalSetting);
