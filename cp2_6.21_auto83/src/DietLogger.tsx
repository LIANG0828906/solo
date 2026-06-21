import React, { useState, useEffect } from 'react';
import { NutritionValue, lookupNutrition } from './utils/nutritionDB';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealEntry {
  id: string;
  meal: MealType;
  foodName: string;
  amount: number;
  unit: 'g' | '份';
  nutrition: NutritionValue;
}

interface Props {
  entries: MealEntry[];
  setEntries: React.Dispatch<React.SetStateAction<MealEntry[]>>;
}

const MEAL_INFO: Record<MealType, { name: string; icon: string; cls: string }> = {
  breakfast: { name: '早餐', icon: '🌅', cls: 'meal-breakfast' },
  lunch: { name: '午餐', icon: '☀️', cls: 'meal-lunch' },
  dinner: { name: '晚餐', icon: '🌙', cls: 'meal-dinner' },
  snack: { name: '加餐', icon: '🍪', cls: 'meal-snack' },
};

const initialSamples: MealEntry[] = [
  { id: 's1', meal: 'breakfast', foodName: '燕麦', amount: 50, unit: 'g', nutrition: lookupNutrition('燕麦', 50, 'g') },
  { id: 's2', meal: 'breakfast', foodName: '牛奶', amount: 250, unit: 'g', nutrition: lookupNutrition('牛奶', 250, 'g') },
  { id: 's3', meal: 'lunch', foodName: '米饭', amount: 150, unit: 'g', nutrition: lookupNutrition('米饭', 150, 'g') },
  { id: 's4', meal: 'lunch', foodName: '鸡胸肉', amount: 120, unit: 'g', nutrition: lookupNutrition('鸡胸肉', 120, 'g') },
  { id: 's5', meal: 'lunch', foodName: '西兰花', amount: 180, unit: 'g', nutrition: lookupNutrition('西兰花', 180, 'g') },
  { id: 's6', meal: 'dinner', foodName: '三文鱼', amount: 150, unit: 'g', nutrition: lookupNutrition('三文鱼', 150, 'g') },
  { id: 's7', meal: 'snack', foodName: '苹果', amount: 1, unit: '份', nutrition: lookupNutrition('苹果', 1, '份') },
];

export default function DietLogger({ entries, setEntries }: Props) {
  const [forms, setForms] = useState<Record<MealType, { name: string; amt: string; unit: 'g' | '份' }>>({
    breakfast: { name: '', amt: '100', unit: 'g' },
    lunch: { name: '', amt: '150', unit: 'g' },
    dinner: { name: '', amt: '150', unit: 'g' },
    snack: { name: '', amt: '50', unit: 'g' },
  });

  useEffect(() => {
    if (entries.length === 0) {
      setEntries(initialSamples);
    }
  }, []);

  const updateForm = (m: MealType, patch: Partial<typeof forms.breakfast>) => {
    setForms((f) => ({ ...f, [m]: { ...f[m], ...patch } }));
  };

  const addEntry = (m: MealType) => {
    const f = forms[m];
    if (!f.name.trim()) return;
    const amt = parseFloat(f.amt);
    if (isNaN(amt) || amt <= 0) return;
    const nu = lookupNutrition(f.name, amt, f.unit);
    if (nu.calories === 0 && f.name.trim() !== '水') {
      alert('未找到该食物的营养数据，请尝试其他名称（如：鸡胸肉、米饭、苹果等）');
    }
    const e: MealEntry = {
      id: Date.now() + Math.random().toString(36).slice(2),
      meal: m,
      foodName: f.name.trim(),
      amount: amt,
      unit: f.unit,
      nutrition: nu,
    };
    setEntries((list) => [...list, e]);
    updateForm(m, { name: '', amt: m === 'breakfast' ? '100' : m === 'lunch' ? '150' : m === 'dinner' ? '150' : '50' });
  };

  const deleteEntry = (id: string) => {
    setEntries((list) => list.filter((e) => e.id !== id));
  };

  return (
    <div className="card">
      <div className="card-title">📝 每日饮食记录</div>

      <div className="meal-grid">
        {(Object.keys(MEAL_INFO) as MealType[]).map((m) => {
          const list = entries.filter((e) => e.meal === m);
          const info = MEAL_INFO[m];
          const totalCals = list.reduce((s, e) => s + e.nutrition.calories, 0);
          return (
            <div key={m} className={`meal-card ${info.cls}`}>
              <div className="meal-head">
                <span><span className="meal-icon">{info.icon}</span> {info.name}</span>
                <span style={{ fontSize: 12, color: 'var(--coral)', fontWeight: 600 }}>
                  {Math.round(totalCals)} kcal
                </span>
              </div>
              <div className="meal-entries">
                {list.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 10px', fontSize: 12, color: 'var(--text-lighter)' }}>
                    暂无记录
                  </div>
                )}
                {list.map((e) => (
                  <div className="meal-entry" key={e.id}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.foodName} <span style={{ color: 'var(--text-lighter)', fontSize: 11 }}>
                        {e.amount}{e.unit} · {Math.round(e.nutrition.calories)}kcal
                      </span>
                    </span>
                    <span className="del" onClick={() => deleteEntry(e.id)}>✕</span>
                  </div>
                ))}
              </div>
              <div className="add-form">
                <input
                  className="inp-name"
                  placeholder={`输入${info.name}食物`}
                  value={forms[m].name}
                  onChange={(e) => updateForm(m, { name: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') addEntry(m); }}
                />
                <input
                  className="inp-amt"
                  type="number"
                  min="0"
                  value={forms[m].amt}
                  onChange={(e) => updateForm(m, { amt: e.target.value })}
                />
                <select
                  value={forms[m].unit}
                  onChange={(e) => updateForm(m, { unit: e.target.value as 'g' | '份' })}
                >
                  <option value="g">克</option>
                  <option value="份">份</option>
                </select>
                <button className="add-btn" onClick={() => addEntry(m)} title="添加">＋</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
