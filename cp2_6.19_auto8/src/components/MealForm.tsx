import { useState, useCallback, useRef } from 'react';
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

    if (navigator.vibrate) {
      navigator.vibrate(50);
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

  const handleFoodSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFoodName(e.target.value);
    setError('');
  };

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
          onChange={(e) => {
            setGrams(e.target.value);
            setError('');
          }}
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
          onChange={(e) => setMealType(e.target.value as MealFormData['mealType'])}
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

export default MealForm;
