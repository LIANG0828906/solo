import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import './NutritionChart.css';

const recommendedDaily = {
  calories: 2000,
  protein: 60,
  carbs: 250,
  fat: 65,
};

const COLORS = {
  calories: '#F59E0B',
  protein: '#10B981',
  carbs: '#3B82F6',
  fat: '#EF4444',
};

export default function DailySummary() {
  const { nutrition, selectedDay } = useSelector((state: RootState) => state.app);

  if (!nutrition) {
    return <div className="nutrition-loading">加载中...</div>;
  }

  const daily = nutrition.daily[selectedDay];

  const nutrients = [
    { key: 'calories', label: '热量', value: daily.calories, unit: 'kcal', rec: recommendedDaily.calories, color: COLORS.calories },
    { key: 'protein', label: '蛋白质', value: daily.protein, unit: 'g', rec: recommendedDaily.protein, color: COLORS.protein },
    { key: 'carbs', label: '碳水', value: daily.carbs, unit: 'g', rec: recommendedDaily.carbs, color: COLORS.carbs },
    { key: 'fat', label: '脂肪', value: daily.fat, unit: 'g', rec: recommendedDaily.fat, color: COLORS.fat },
  ];

  return (
    <div className="daily-summary-card">
      <h3 className="summary-title">今日营养汇总</h3>
      <div className="summary-day">{daily.day}</div>
      <div className="nutrient-grid">
        {nutrients.map(n => (
          <div key={n.key} className="nutrient-item">
            <div className="nutrient-label">{n.label}</div>
            <div className="nutrient-value">{n.value} <span>{n.unit}</span></div>
            <div className="nutrient-bar">
              <div
                className="nutrient-bar-fill"
                style={{
                  width: `${Math.min(100, (n.value / n.rec) * 100)}%`,
                  backgroundColor: n.color,
                }}
              />
            </div>
            <div className="nutrient-pct">
              {Math.round((n.value / n.rec) * 100)}% 推荐量
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
