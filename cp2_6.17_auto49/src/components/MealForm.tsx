import React, { useState, useMemo } from 'react';
import { estimateFoodCalories } from '../utils/calories';
import { formatDate } from '../utils/dateUtils';
import { useFitTrackyStore } from '../store';
import './forms.css';

const MealForm: React.FC = () => {
  const [foodName, setFoodName] = useState<string>('');
  const [portion, setPortion] = useState<number>(100);
  const [date, setDate] = useState<string>(formatDate(new Date()));
  const addMealRecord = useFitTrackyStore((state) => state.addMealRecord);

  const estimatedCalories = useMemo(() => {
    if (!foodName) return 0;
    const per100g = estimateFoodCalories(foodName);
    return Math.round(per100g * portion / 100);
  }, [foodName, portion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim() || portion <= 0) return;
    
    addMealRecord({
      date,
      foodName: foodName.trim(),
      portion,
      calories: estimatedCalories,
    });
    
    setFoodName('');
    setPortion(100);
  };

  return (
    <div className="form-card">
      <h3 className="form-title">🍽️ 饮食记录</h3>
      <form onSubmit={handleSubmit} className="meal-form">
        <div className="form-group">
          <label htmlFor="meal-date">日期</label>
          <input
            type="date"
            id="meal-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="food-name">食物名称</label>
          <input
            type="text"
            id="food-name"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder="如：米饭、鸡胸肉、蔬菜沙拉"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="food-portion">份量 (克)</label>
          <input
            type="number"
            id="food-portion"
            value={portion}
            onChange={(e) => setPortion(Number(e.target.value))}
            min="1"
            max="2000"
            className="form-input"
          />
        </div>

        <div className="calories-display">
          <span className="calories-label">估算热量</span>
          <span className="calories-value">{estimatedCalories} 卡</span>
        </div>

        <button type="submit" className="submit-btn">
          添加记录
        </button>
      </form>
    </div>
  );
};

export default MealForm;
