import { useEffect, useState } from 'react';
import { calculateDailyIntake, getRemainingCalories } from '@/utils/nutrition';
import type { FoodRecord, NutritionGoals } from '@/types';

interface DashboardProps {
  records: FoodRecord[];
  goals: NutritionGoals | null;
}

interface RingProgressProps {
  value: number;
  max: number;
  color: string;
  label: string;
  unit: string;
}

function RingProgress({ value, max, color, label, unit }: RingProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = max > 0 ? Math.min((animatedValue / max) * 100, 100) : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="ring-container">
      <svg className="ring-svg" width="100" height="100" viewBox="0 0 100 100">
        <circle
          className="ring-bg"
          cx="50"
          cy="50"
          r={radius}
        />
        <circle
          className="ring-progress"
          cx="50"
          cy="50"
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={{ strokeDashoffset }}
        />
      </svg>
      <div className="ring-label">
        <div className="ring-value" style={{ color }}>
          {Math.round(percentage)}%
        </div>
        <div className="ring-name">{label}</div>
        <div className="ring-name">{Math.round(animatedValue)}/{Math.round(max)}{unit}</div>
      </div>
    </div>
  );
}

export default function Dashboard({ records, goals }: DashboardProps) {
  const intake = calculateDailyIntake(records);
  const remaining = goals ? getRemainingCalories(goals, intake) : 0;
  const isNegative = remaining < 0;

  if (!goals) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="dashboard">
      <h2 className="section-title">营养仪表盘</h2>
      <div className="dashboard-rings">
        <RingProgress
          value={intake.protein}
          max={goals.protein}
          color="#4A90D9"
          label="蛋白质"
          unit="g"
        />
        <RingProgress
          value={intake.carbs}
          max={goals.carbs}
          color="#F5C842"
          label="碳水"
          unit="g"
        />
        <RingProgress
          value={intake.fat}
          max={goals.fat}
          color="#9B59B6"
          label="脂肪"
          unit="g"
        />
      </div>
      <div className="dashboard-calories">
        <div className="calories-label">今日剩余热量</div>
        <div className={`calories-value ${isNegative ? 'negative' : ''}`}>
          {isNegative ? Math.abs(remaining) : remaining} kcal
        </div>
        <div className="calories-consumed">
          已摄入 {Math.round(intake.calories)} / {goals.calories} kcal
        </div>
      </div>
    </div>
  );
}
