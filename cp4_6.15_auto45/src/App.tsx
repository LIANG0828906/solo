import React, { createContext, useContext, useState, useMemo } from 'react';
import MealCard, { FoodEntry, MealType, calculateNutrition } from './components/MealCard';
import NutritionSummary from './components/NutritionSummary';
import { Food } from './data/foodDatabase';

interface AppContextType {
  records: Record<string, Record<MealType, FoodEntry[]>>;
  addFoodEntry: (date: string, mealType: MealType, food: Food, amount: number) => void;
  removeFoodEntry: (date: string, mealType: MealType, entryId: string) => void;
  calorieGoal: number;
  currentDate: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

const generateSampleData = (): Record<string, Record<MealType, FoodEntry[]>> => {
  const today = getTodayDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

  return {
    [today]: {
      breakfast: [
        { id: 'b1', foodId: '1', name: '白米饭', icon: '🍚', amount: 150, unit: 'g', calories: 174, protein: 3.9, fat: 0.5, carbs: 38.9, fiber: 0.5 },
        { id: 'b2', foodId: '14', name: '鸡蛋', icon: '🥚', amount: 1, unit: '份', calories: 72, protein: 6.7, fat: 4.4, carbs: 1.4, fiber: 0 },
      ],
      lunch: [
        { id: 'l1', foodId: '11', name: '鸡胸肉', icon: '🍗', amount: 150, unit: 'g', calories: 200, protein: 29.1, fat: 7.5, carbs: 3.8, fiber: 0 },
        { id: 'l2', foodId: '21', name: '西兰花', icon: '🥦', amount: 200, unit: 'g', calories: 72, protein: 5.6, fat: 0.8, carbs: 8.6, fiber: 3.2 },
      ],
      dinner: [],
      snack: [
        { id: 's1', foodId: '31', name: '苹果', icon: '🍎', amount: 1, unit: '份', calories: 54, protein: 0.2, fat: 0.2, carbs: 13.5, fiber: 1.2 },
      ],
    },
    [yesterdayStr]: {
      breakfast: [
        { id: 'yb1', foodId: '5', name: '燕麦粥', icon: '🥣', amount: 300, unit: 'g', calories: 204, protein: 7.2, fat: 4.2, carbs: 36, fiber: 5.1 },
      ],
      lunch: [
        { id: 'yl1', foodId: '12', name: '牛肉', icon: '🥩', amount: 120, unit: 'g', calories: 150, protein: 23.9, fat: 5, carbs: 2.4, fiber: 0 },
      ],
      dinner: [],
      snack: [],
    },
    [twoDaysAgoStr]: {
      breakfast: [],
      lunch: [
        { id: 'tl1', foodId: '3', name: '面条', icon: '🍜', amount: 300, unit: 'g', calories: 327, protein: 13.5, fat: 1.5, carbs: 66, fiber: 2.4 },
      ],
      dinner: [
        { id: 'td1', foodId: '14', name: '鸡蛋', icon: '🥚', amount: 2, unit: '份', calories: 144, protein: 13.3, fat: 8.8, carbs: 2.8, fiber: 0 },
      ],
      snack: [
        { id: 'ts1', foodId: '32', name: '香蕉', icon: '🍌', amount: 1, unit: '份', calories: 93, protein: 1.4, fat: 0.2, carbs: 22, fiber: 1.2 },
      ],
    },
  };
};

const App: React.FC = () => {
  const currentDate = getTodayDate();
  const [records, setRecords] = useState<Record<string, Record<MealType, FoodEntry[]>>>(generateSampleData);
  const [calorieGoal] = useState(2000);

  const addFoodEntry = (date: string, mealType: MealType, food: Food, amount: number) => {
    const nutrition = calculateNutrition(food, amount, food.defaultUnit);
    const newEntry: FoodEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      foodId: food.id,
      name: food.name,
      icon: food.icon,
      amount,
      unit: food.defaultUnit,
      ...nutrition,
    };

    setRecords((prev) => {
      const dayRecord = prev[date] || { breakfast: [], lunch: [], dinner: [], snack: [] };
      return {
        ...prev,
        [date]: {
          ...dayRecord,
          [mealType]: [...dayRecord[mealType], newEntry],
        },
      };
    });
  };

  const removeFoodEntry = (date: string, mealType: MealType, entryId: string) => {
    setRecords((prev) => {
      const dayRecord = prev[date];
      if (!dayRecord) return prev;
      return {
        ...prev,
        [date]: {
          ...dayRecord,
          [mealType]: dayRecord[mealType].filter((e) => e.id !== entryId),
        },
      };
    });
  };

  const todayEntries = useMemo(() => {
    const todayRecord = records[currentDate] || { breakfast: [], lunch: [], dinner: [], snack: [] };
    return [
      ...todayRecord.breakfast,
      ...todayRecord.lunch,
      ...todayRecord.dinner,
      ...todayRecord.snack,
    ];
  }, [records, currentDate]);

  const todayRecord = records[currentDate] || { breakfast: [], lunch: [], dinner: [], snack: [] };

  const contextValue: AppContextType = {
    records,
    addFoodEntry,
    removeFoodEntry,
    calorieGoal,
    currentDate,
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen pb-24">
        <div className="max-w-[800px] mx-auto px-4 pt-6">
          <header className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">🥗</span>
              <h1 className="text-2xl font-bold text-gray-800">健康饮食日志</h1>
            </div>
            <p className="text-sm text-gray-500">{formatDate(currentDate)}</p>
          </header>

          <div className="space-y-4 mb-6">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType, idx) => (
              <div key={mealType} className="animate-slide-up" style={{ animationDelay: `${idx * 80}ms` }}>
                <MealCard
                  mealType={mealType}
                  entries={todayRecord[mealType]}
                  calorieGoal={calorieGoal}
                  onAddFood={(mt, food, amount) => addFoodEntry(currentDate, mt, food, amount)}
                  onRemoveFood={(mt, entryId) => removeFoodEntry(currentDate, mt, entryId)}
                />
              </div>
            ))}
          </div>

          <NutritionSummary
            entries={todayEntries}
            records={records}
            calorieGoal={calorieGoal}
            currentDate={currentDate}
          />
        </div>
      </div>
    </AppContext.Provider>
  );
};

export default App;
