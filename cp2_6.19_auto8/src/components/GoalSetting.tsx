import { useState, useCallback, useEffect } from 'react';
import type { NutritionGoals } from '../types';

interface GoalSettingProps {
  currentGoals: NutritionGoals;
  onUpdateGoals: (goals: Partial<NutritionGoals>) => void;
}

function GoalSetting({ currentGoals, onUpdateGoals }: GoalSettingProps) {
  const [localGoals, setLocalGoals] = useState(currentGoals);
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null);

  useEffect(() => {
    setLocalGoals(currentGoals);
  }, [currentGoals]);

  const handleChange = useCallback((field: keyof NutritionGoals, value: string) => {
    const numValue = parseFloat(value) || 0;
    setLocalGoals(prev => ({ ...prev, [field]: numValue }));

    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
    }

    const timer = window.setTimeout(() => {
      onUpdateGoals({ [field]: numValue });
    }, 300);

    setDebounceTimer(timer);
  }, [debounceTimer, onUpdateGoals]);

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

export default GoalSetting;
