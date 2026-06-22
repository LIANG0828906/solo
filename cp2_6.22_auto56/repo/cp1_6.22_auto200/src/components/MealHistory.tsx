import React from 'react';
import { MealRecord, MEAL_TYPE_MAP, DailyTotal, DailyGoals } from '../services/api';

interface MealHistoryProps {
  historyMeals: MealRecord[];
  goals: DailyGoals | null;
}

const MEAL_BG: Record<string, string> = {
  breakfast: '#FEF3C7',
  lunch: '#ECFDF5',
  dinner: '#FCE7F3',
  snack: '#E0F2FE',
};

const round = (n: number) => Math.round(n * 100) / 100;

const sumNutrition = (foods: MealRecord['foods']): DailyTotal => {
  const sum = { calories: 0, protein: 0, fat: 0, carbs: 0, sodium: 0 };
  foods.forEach(item => {
    const ratio = item.grams / 100;
    sum.calories += round(item.food.calories * ratio);
    sum.protein += round(item.food.protein * ratio);
    sum.fat += round(item.food.fat * ratio);
    sum.carbs += round(item.food.carbs * ratio);
    sum.sodium += round(item.food.sodium * ratio);
  });
  Object.keys(sum).forEach(k => {
    (sum as any)[k] = round((sum as any)[k]);
  });
  return sum;
};

const groupByDate = (meals: MealRecord[]): Record<string, MealRecord[]> => {
  const groups: Record<string, MealRecord[]> = {};
  meals.forEach(m => {
    if (!groups[m.date]) groups[m.date] = [];
    groups[m.date].push(m);
  });
  Object.keys(groups).forEach(d => {
    groups[d].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  });
  return groups;
};

const MealHistory: React.FC<MealHistoryProps> = ({ historyMeals, goals }) => {
  const [expandedDates, setExpandedDates] = React.useState<Set<string>>(new Set());
  const groups = React.useMemo(() => groupByDate(historyMeals), [historyMeals]);
  const sortedDates = React.useMemo(
    () => Object.keys(groups).sort((a, b) => b.localeCompare(a)),
    [groups]
  );

  const toggleDate = (date: string) => {
    const next = new Set(expandedDates);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    setExpandedDates(next);
  };

  const calcDayTotal = (meals: MealRecord[]): DailyTotal => {
    const total = { calories: 0, protein: 0, fat: 0, carbs: 0, sodium: 0 };
    meals.forEach(m => {
      const s = sumNutrition(m.foods);
      total.calories += s.calories;
      total.protein += s.protein;
      total.fat += s.fat;
      total.carbs += s.carbs;
      total.sodium += s.sodium;
    });
    Object.keys(total).forEach(k => {
      (total as any)[k] = round((total as any)[k]);
    });
    return total;
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>历史记录（近7天）</h2>
      {sortedDates.length === 0 ? (
        <div style={styles.empty}>暂无记录</div>
      ) : (
        <div style={styles.timeline}>
          {sortedDates.map(date => {
            const meals = groups[date];
            const dayTotal = calcDayTotal(meals);
            const expanded = expandedDates.has(date);
            return (
              <div key={date} style={styles.dateGroup}>
                <div
                  onClick={() => toggleDate(date)}
                  style={styles.dateHeader}
                >
                  <div style={styles.dateLeft}>
                    <span style={styles.dateArrow}>{expanded ? '▾' : '▸'}</span>
                    <span style={styles.dateText}>{date}</span>
                    <span style={styles.mealCount}>{meals.length} 餐</span>
                  </div>
                  <div style={styles.dateRight}>
                    <strong style={styles.caloriesText}>{dayTotal.calories}</strong>
                    <span style={styles.kcalUnit}>kcal</span>
                  </div>
                </div>
                {expanded && (
                  <div style={styles.mealsList}>
                    {meals.map(meal => {
                      const s = sumNutrition(meal.foods);
                      return (
                        <div
                          key={meal.id}
                          className="meal-card-hover"
                          style={{
                            ...styles.mealCard,
                            background: MEAL_BG[meal.mealType] || '#F9FAFB',
                          }}
                        >
                          <div style={styles.mealCardHeader}>
                            <span style={styles.mealBadge}>
                              {MEAL_TYPE_MAP[meal.mealType]}
                            </span>
                            <span style={styles.mealTime}>
                              {new Date(meal.createdAt).toLocaleTimeString('zh-CN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div style={styles.foodList}>
                            {meal.foods.map((fi, idx) => (
                              <div key={idx} style={styles.foodItem}>
                                {fi.food.name} <span style={styles.grams}>× {fi.grams}g</span>
                              </div>
                            ))}
                          </div>
                          <div style={styles.nutritionRow}>
                            <span style={styles.nutChip}>🔥 {s.calories} kcal</span>
                            <span style={styles.nutChip}>💪 {s.protein}g</span>
                            <span style={styles.nutChip}>🥩 {s.fat}g</span>
                            <span style={styles.nutChip}>🍚 {s.carbs}g</span>
                            <span style={styles.nutChip}>🧂 {s.sodium}mg</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(10px)',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 20,
    color: '#1F2937',
  },
  empty: {
    textAlign: 'center',
    padding: 40,
    color: '#9CA3AF',
    fontSize: 14,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  dateGroup: {},
  dateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#F9FAFB',
    borderRadius: 8,
    cursor: 'pointer',
    border: '1px solid #F3F4F6',
  },
  dateLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  dateArrow: {
    color: '#6B7280',
    fontSize: 12,
  },
  dateText: {
    fontWeight: 600,
    color: '#1F2937',
    fontSize: 15,
  },
  mealCount: {
    fontSize: 12,
    color: '#9CA3AF',
    background: '#E5E7EB',
    padding: '2px 8px',
    borderRadius: 999,
  },
  dateRight: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
  },
  caloriesText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#F59E0B',
  },
  kcalUnit: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  mealsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 12,
    paddingLeft: 8,
  },
  mealCard: {
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  mealCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealBadge: {
    fontWeight: 600,
    fontSize: 14,
    color: '#374151',
  },
  mealTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  foodList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px 12px',
    marginBottom: 12,
  },
  foodItem: {
    fontSize: 13,
    color: '#374151',
  },
  grams: {
    color: '#6B7280',
    fontSize: 12,
  },
  nutritionRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  nutChip: {
    fontSize: 12,
    padding: '4px 8px',
    background: 'rgba(255,255,255,0.7)',
    borderRadius: 999,
    color: '#4B5563',
  },
};

export default MealHistory;
