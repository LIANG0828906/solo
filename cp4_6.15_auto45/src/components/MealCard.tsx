import React, { useState } from 'react';
import { Trash2, Plus, ChevronDown, ChevronUp, Coffee, UtensilsCrossed, Moon, Cookie } from 'lucide-react';
import { Food } from '@/data/foodDatabase';
import FoodSearch from './FoodSearch';

export interface FoodEntry {
  id: string;
  foodId: string;
  name: string;
  icon: string;
  amount: number;
  unit: 'g' | 'ml' | '份';
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface MealCardProps {
  mealType: MealType;
  entries: FoodEntry[];
  calorieGoal: number;
  onAddFood: (mealType: MealType, food: Food, amount: number) => void;
  onRemoveFood: (mealType: MealType, entryId: string) => void;
  newEntryIds?: Set<string>;
}

const mealConfig: Record<MealType, {
  name: string;
  icon: React.ReactNode;
  gradient: string;
  textColor: string;
  goalRatio: number;
}> = {
  breakfast: {
    name: '早餐',
    icon: <Coffee size={18} />,
    gradient: 'linear-gradient(135deg, #FFF3CD 0%, #FFE0B2 100%)',
    textColor: '#8B6914',
    goalRatio: 0.3,
  },
  lunch: {
    name: '午餐',
    icon: <UtensilsCrossed size={18} />,
    gradient: 'linear-gradient(135deg, #C8E6C9 0%, #81C784 100%)',
    textColor: '#2E7D32',
    goalRatio: 0.4,
  },
  dinner: {
    name: '晚餐',
    icon: <Moon size={18} />,
    gradient: 'linear-gradient(135deg, #E1BEE7 0%, #BA68C8 100%)',
    textColor: '#6A1B9A',
    goalRatio: 0.25,
  },
  snack: {
    name: '加餐',
    icon: <Cookie size={18} />,
    gradient: 'linear-gradient(135deg, #F8BBD0 0%, #E0E0E0 100%)',
    textColor: '#AD1457',
    goalRatio: 0.05,
  },
};

const calculateNutrition = (food: Food, amount: number, unit: string) => {
  const baseAmount = unit === '份' ? 100 : 100;
  const ratio = amount / baseAmount;
  return {
    calories: Math.round(food.calories * ratio),
    protein: Math.round(food.protein * ratio * 10) / 10,
    fat: Math.round(food.fat * ratio * 10) / 10,
    carbs: Math.round(food.carbs * ratio * 10) / 10,
    fiber: Math.round(food.fiber * ratio * 10) / 10,
  };
};

const MealCard: React.FC<MealCardProps> = ({
  mealType,
  entries,
  calorieGoal,
  onAddFood,
  onRemoveFood,
  newEntryIds = new Set(),
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const config = mealConfig[mealType];

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
  const targetCalories = calorieGoal * config.goalRatio;
  const progress = Math.min((totalCalories / targetCalories) * 100, 100);

  const handleAddFood = (food: Food, amount: number) => {
    onAddFood(mealType, food, amount);
    setShowSearch(false);
  };

  return (
    <div
      className="rounded-2xl shadow-sm overflow-hidden card-hover"
      style={{ background: config.gradient }}
    >
      <div
        className="p-4 flex items-center gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/50"
          style={{ color: config.textColor }}
        >
          {config.icon}
        </div>
        <div className="flex-1">
          <div className="font-semibold" style={{ color: config.textColor }}>
            {config.name}
          </div>
          <div className="mt-1 h-2 bg-white/40 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor: config.textColor,
                opacity: 0.7,
              }}
            />
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg" style={{ color: config.textColor }}>
            {totalCalories}
          </div>
          <div className="text-xs opacity-70" style={{ color: config.textColor }}>
            / {Math.round(targetCalories)} kcal
          </div>
        </div>
        <div style={{ color: config.textColor }}>
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="space-y-2">
            {entries.map((entry, index) => {
              const isNew = newEntryIds.has(entry.id);
              return (
                <div
                  key={entry.id}
                  className={`bg-white/80 rounded-xl p-3 flex items-center gap-3 ${
                    isNew ? 'animate-bounce-in' : 'animate-slide-up'
                  }`}
                  style={{
                    animationDelay: isNew ? '0ms' : `${index * 50}ms`,
                  }}
                >
                  <span className="text-2xl">{entry.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {entry.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>
                        {entry.amount}
                        {entry.unit}
                      </span>
                      <span className="text-[#98D8C8] font-medium">
                        {entry.calories} kcal
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-xs text-gray-400 mr-2">
                    <div>蛋白 {entry.protein}g</div>
                    <div>碳水 {entry.carbs}g</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFood(mealType, entry.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {showSearch ? (
            <div className="mt-3 bg-white/80 rounded-xl p-3 animate-fade-in">
              <FoodSearch onSelectFood={handleAddFood} placeholder={`搜索食物添加到${config.name}...`} />
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSearch(true);
              }}
              className="mt-3 w-full py-3 bg-white/60 hover:bg-white/80 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 btn-hover"
              style={{ color: config.textColor }}
            >
              <Plus size={18} />
              <span className="font-medium">添加食物</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export { calculateNutrition };
export default MealCard;
