import { useState } from 'react';
import { X } from 'lucide-react';
import { calculateNutritionForAmount } from '@/utils/nutrition';
import type { Food } from '@/types';

interface AddFoodModalProps {
  food: Food | null;
  onClose: () => void;
  onAdd: (amount: number, mealType: string) => void;
}

export default function AddFoodModal({ food, onClose, onAdd }: AddFoodModalProps) {
  const [amount, setAmount] = useState(100);
  const [mealType, setMealType] = useState('breakfast');

  if (!food) return null;

  const nutrition = calculateNutritionForAmount(food, amount);

  const handleSubmit = () => {
    onAdd(amount, mealType);
    onClose();
  };

  const mealTypes = [
    { value: 'breakfast', label: '早餐' },
    { value: 'lunch', label: '午餐' },
    { value: 'dinner', label: '晚餐' },
    { value: 'snack1', label: '加餐1' },
    { value: 'snack2', label: '加餐2' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">添加 {food.name}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <table className="nutrition-table">
          <tbody>
            <tr>
              <td>蛋白质</td>
              <td>{nutrition.protein} g</td>
            </tr>
            <tr>
              <td>碳水化合物</td>
              <td>{nutrition.carbs} g</td>
            </tr>
            <tr>
              <td>脂肪</td>
              <td>{nutrition.fat} g</td>
            </tr>
            <tr>
              <td>纤维素</td>
              <td>{(food.fiber * amount / 100).toFixed(1)} g</td>
            </tr>
            <tr>
              <td>热量</td>
              <td>{nutrition.calories} kcal</td>
            </tr>
          </tbody>
        </table>

        <div className="form-group">
          <label className="label">摄入量（克）</label>
          <div className="stepper-input">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setAmount(Math.max(1, amount - 10))}
            >
              -
            </button>
            <input
              type="number"
              className="input"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              min="1"
            />
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setAmount(amount + 10)}
            >
              +
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="label">餐段</label>
          <select
            className="select"
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
          >
            {mealTypes.map((mt) => (
              <option key={mt.value} value={mt.value}>
                {mt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            确认添加
          </button>
        </div>
      </div>
    </div>
  );
}
