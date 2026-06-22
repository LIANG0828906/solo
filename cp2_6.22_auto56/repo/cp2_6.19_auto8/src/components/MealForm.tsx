/**
 * ============================================================
 *  MealForm.tsx - 餐食输入表单组件
 * ============================================================
 * 
 * 【职责】：
 *  1. 接收用户输入：食物名称(下拉选择)、份量(克)、餐次选择
 *  2. 表单验证：检查必填项和有效性
 *  3. 调用营养计算工具，将计算结果通过回调传给App
 *  4. 提交反馈：微震动 + 表单淡入动画 + 按钮涟漪效果
 * 
 * 【调用关系】：
 *  ┌─────────────────────────────────────────────┐
 *  │                MealForm.tsx                 │
 *  │                                             │
 *  │  输入来源                                    │
 *  │  ├─ <select> foodName  (食物下拉)           │
 *  │  ├─ <input>  grams     (份量数字)           │
 *  │  └─ <select> mealType  (早餐/午餐/晚餐/加餐)│
 *  │                    │                        │
 *  │                    ▼  onSubmit              │
 *  │           handleSubmit(e)                   │
 *  │                    │                        │
 *  │                    ▼  调用计算               │
 *  │  calculateMealNutrients(formData)           │
 *  │  from '../utils/calculateNutrients.ts'      │
 *  │                    │                        │
 *  │                    ▼  通过props回调          │
 *  │         props.onAddMeal(result: MealEntry)  │
 *  │                    │                        │
 *  │                    ▼                        │
 *  │              ↑ App.tsx ↑                    │
 *  │         (更新 meals 状态)                    │
 *  │                                             │
 *  │  动画/反馈:                                  │
 *  │  ├─ navigator.vibrate(50)  微震动           │
 *  │  ├─ createRipple()  按钮涟漪                │
 *  │  └─ form-fade-in  表单淡入动画              │
 *  └─────────────────────────────────────────────┘
 * 
 * 【数据流向】：
 *  用户UI交互 → 本地state → 提交时构造MealFormData
 *    → 调用calculateMealNutrients → 获取MealEntry
 *    → onAddMeal回调 → App全局状态
 * ============================================================
 */

import { memo, useState, useCallback, useRef } from 'react';
import type { MealEntry, MealFormData } from '../types';
import { calculateMealNutrients, getFoodList } from '../utils/calculateNutrients';

interface MealFormProps {
  onAddMeal: (meal: MealEntry) => void;
}

function MealForm({ onAddMeal }: MealFormProps) {
  const [foodName, setFoodName] = useState('');
  const [grams, setGrams] = useState('');
  const [mealType, setMealType] = useState<MealFormData['mealType']>('breakfast');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFadeIn, setShowFadeIn] = useState(false);
  const [error, setError] = useState('');
  const foodList = getFoodList();
  const formRef = useRef<HTMLFormElement>(null);

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
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!foodName.trim()) {
      setError('请选择或输入食物名称');
      return;
    }

    const gramsNum = parseFloat(grams);
    if (isNaN(gramsNum) || gramsNum <= 0) {
      setError('请输入有效的份量（克）');
      return;
    }

    const formData: MealFormData = {
      foodName: foodName.trim(),
      grams: gramsNum,
      mealType,
    };

    const result = calculateMealNutrients(formData);
    
    if (!result) {
      setError('未找到该食物的营养数据，请从下拉列表中选择');
      return;
    }

    setIsSubmitting(true);

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(50);
      } catch {
        // 忽略震动异常
      }
    }

    onAddMeal(result);

    setShowFadeIn(true);
    setTimeout(() => {
      setShowFadeIn(false);
    }, 300);

    setFoodName('');
    setGrams('');
    setMealType('breakfast');
    setIsSubmitting(false);
  }, [foodName, grams, mealType, onAddMeal]);

  const handleFoodSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFoodName(e.target.value);
    setError('');
  }, []);

  const handleMealTypeSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setMealType(e.target.value as MealFormData['mealType']);
  }, []);

  const handleGramsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGrams(e.target.value);
    setError('');
  }, []);

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit} 
      className={`meal-form ${showFadeIn ? 'form-fade-in' : ''}`}
    >
      <div className="form-group">
        <label htmlFor="foodName">食物名称</label>
        <select
          id="foodName"
          value={foodName}
          onChange={handleFoodSelect}
          disabled={isSubmitting}
        >
          <option value="">请选择食物...</option>
          {foodList.map(food => (
            <option key={food} value={food}>{food}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="grams">份量（克）</label>
        <input
          id="grams"
          type="number"
          value={grams}
          onChange={handleGramsChange}
          placeholder="例如: 100"
          min="1"
          step="1"
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="mealType">餐次</label>
        <select
          id="mealType"
          value={mealType}
          onChange={handleMealTypeSelect}
          disabled={isSubmitting}
        >
          <option value="breakfast">🌅 早餐</option>
          <option value="lunch">☀️ 午餐</option>
          <option value="dinner">🌙 晚餐</option>
          <option value="snack">🍎 加餐</option>
        </select>
      </div>

      {error && (
        <div style={{ color: 'var(--error-color)', fontSize: '14px', marginBottom: '16px' }}>
          ⚠️ {error}
        </div>
      )}

      <button 
        type="submit" 
        className="btn btn-primary"
        disabled={isSubmitting || !foodName || !grams}
        onClick={createRipple}
        style={{ width: '100%' }}
      >
        {isSubmitting ? '添加中...' : '➕ 添加记录'}
      </button>
    </form>
  );
}

export default memo(MealForm);
