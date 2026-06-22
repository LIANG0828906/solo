import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Coffee,
  UtensilsCrossed,
  Moon,
  Cookie,
  RefreshCw,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Home,
  Calendar,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useNutritionStore } from '@/store/nutrition';
import type { DayPlan, PlanMeal } from '../../shared/types';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: Home, path: '/' },
  { key: 'plan', label: 'Plan', icon: Calendar, path: '/plan' },
  { key: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' },
];

const MEAL_TYPE_META: Record<
  PlanMeal['mealType'],
  { label: string; icon: typeof Coffee; shortLabel: string; color: string }
> = {
  breakfast: { label: '早餐', icon: Coffee, shortLabel: '早', color: '#FFB74D' },
  'snack-morning': { label: '上午加餐', icon: Cookie, shortLabel: '加', color: '#FF8A65' },
  lunch: { label: '午餐', icon: UtensilsCrossed, shortLabel: '午', color: '#81C784' },
  'snack-afternoon': { label: '下午加餐', icon: Cookie, shortLabel: '加', color: '#FF8A65' },
  dinner: { label: '晚餐', icon: Moon, shortLabel: '晚', color: '#64B5F6' },
};

interface AddedFoodKey {
  date: string;
  mealType: PlanMeal['mealType'];
  foodId: string;
}

function keyOf(k: AddedFoodKey): string {
  return `${k.date}|${k.mealType}|${k.foodId}`;
}

function formatDate(dateStr: string): { monthDay: string; weekday: string } {
  const d = new Date(dateStr);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return {
    monthDay: `${d.getMonth() + 1}/${d.getDate()}`,
    weekday: `周${weekdays[d.getDay()]}`,
  };
}

export default function Plan() {
  const navigate = useNavigate();
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [addedFoods, setAddedFoods] = useState<Set<string>>(new Set());
  const [successFoods, setSuccessFoods] = useState<Set<string>>(new Set());

  const { plan, loading, fetchPlan, createPlan, addMealFromPlan } = useNutritionStore();

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleRegenerate = async () => {
    try {
      await createPlan();
      setExpandedDate(null);
      setAddedFoods(new Set());
      setSuccessFoods(new Set());
    } catch {
      // ignore
    }
  };

  const toggleExpand = (date: string) => {
    setExpandedDate((prev) => (prev === date ? null : date));
  };

  const handleAddFood = async (
    foodItem: {
      foodId: string;
      foodName: string;
      quantity: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    },
    mealType: PlanMeal['mealType'],
    date: string,
  ) => {
    const k = keyOf({ date, mealType, foodId: foodItem.foodId });
    if (addedFoods.has(k)) return;

    setAddedFoods((prev) => new Set(prev).add(k));

    try {
      await addMealFromPlan(foodItem, mealType, date, foodItem.quantity);
      setSuccessFoods((prev) => new Set(prev).add(k));
    } catch {
      setAddedFoods((prev) => {
        const next = new Set(prev);
        next.delete(k);
        return next;
      });
    }
  };

  const days = plan?.days ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden lg:block">
        <aside
          className="w-64 fixed h-full border-r flex flex-col"
          style={{ backgroundColor: '#F5F0E1', borderColor: '#E8E0CC' }}
        >
          <div className="p-6 border-b" style={{ borderColor: '#E8E0CC' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#7CB342' }}
              >
                <Sun className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg" style={{ color: '#5D4037' }}>NutriTrack</h1>
                <p className="text-xs" style={{ color: '#8D6E63' }}>健康饮食管理</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/plan';
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                    isActive ? 'text-white shadow-md' : 'hover:bg-white hover:shadow-sm',
                  )}
                  style={{
                    backgroundColor: isActive ? '#7CB342' : 'transparent',
                    color: isActive ? '#fff' : '#5D4037',
                    borderRadius: '12px',
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
      </div>

      <div className="lg:ml-64">
        <div className="max-w-6xl mx-auto p-4 lg:p-8 pb-28 lg:pb-8">
          <div className="lg:hidden sticky top-0 z-40 -mx-4 px-4 py-4 mb-6 border-b shadow-sm"
            style={{ backgroundColor: '#F5F0E1', borderColor: '#E8E0CC' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#7CB342' }}
              >
                <Sun className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base" style={{ color: '#5D4037' }}>NutriTrack</h1>
                <p className="text-xs" style={{ color: '#8D6E63' }}>膳食计划</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold" style={{ color: '#5D4037' }}>
                下一周膳食计划
              </h2>
              <p className="mt-1 text-sm" style={{ color: '#8D6E63' }}>
                科学搭配，营养均衡，点击食物即可添加到当日记录
              </p>
            </div>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className={cn(
                'flex items-center gap-2 px-6 py-3 font-semibold text-white transition-all',
                !loading && 'hover:shadow-lg active:scale-[0.97]',
                loading && 'opacity-80 cursor-not-allowed',
              )}
              style={{
                backgroundColor: '#7CB342',
                borderRadius: '12px',
              }}
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              <span>{loading ? '生成中...' : '重新生成'}</span>
            </button>
          </div>

          {days.length === 0 && !loading ? (
            <div
              className="p-12 text-center border-2 border-dashed"
              style={{ borderRadius: '16px', borderColor: '#E0D8C4', backgroundColor: '#FAF7EF' }}
            >
              <Calendar className="w-14 h-14 mx-auto mb-4" style={{ color: '#7CB342' }} />
              <p className="text-lg font-semibold mb-2" style={{ color: '#5D4037' }}>
                还没有膳食计划
              </p>
              <p className="text-sm mb-6" style={{ color: '#8D6E63' }}>
                点击上方按钮，为你生成专属的一周膳食计划
              </p>
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition-all',
                  !loading && 'hover:shadow-lg active:scale-[0.97]',
                  loading && 'opacity-80 cursor-not-allowed',
                )}
                style={{ backgroundColor: '#7CB342', borderRadius: '12px' }}
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                <span>{loading ? '生成中...' : '生成计划'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
              {days.map((day, idx) => {
                const isExpanded = expandedDate === day.date;
                const { monthDay, weekday } = formatDate(day.date);
                const animationDelay = `${Math.min(idx * 50, 350)}ms`;

                return (
                  <div
                    key={day.date}
                    style={{
                      animation: `fadeIn 500ms ease-out ${animationDelay} both, slideUp 500ms ease-out ${animationDelay} both`,
                    }}
                  >
                    <DateCard
                      day={day}
                      monthDay={monthDay}
                      weekday={weekday}
                      isExpanded={isExpanded}
                      onToggle={() => toggleExpand(day.date)}
                      addedFoods={addedFoods}
                      successFoods={successFoods}
                      onAddFood={handleAddFood}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        style={{ backgroundColor: '#fff', borderColor: '#E8E0CC' }}
      >
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/plan';
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1 px-4 py-2"
                style={{ color: isActive ? '#7CB342' : '#9E9E9E' }}
              >
                <Icon className={cn('w-6 h-6', isActive && 'animate-bounce-soft')} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

interface DateCardProps {
  day: DayPlan;
  monthDay: string;
  weekday: string;
  isExpanded: boolean;
  onToggle: () => void;
  addedFoods: Set<string>;
  successFoods: Set<string>;
  onAddFood: (
    foodItem: {
      foodId: string;
      foodName: string;
      quantity: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    },
    mealType: PlanMeal['mealType'],
    date: string,
  ) => void;
}

function DateCard({
  day,
  monthDay,
  weekday,
  isExpanded,
  onToggle,
  addedFoods,
  successFoods,
  onAddFood,
}: DateCardProps) {
  const mealTypesInDay = day.meals.map((m) => m.mealType);
  const uniqueTags = Array.from(
    new Set(mealTypesInDay.map((t) => MEAL_TYPE_META[t].shortLabel)),
  );

  return (
    <div
      className={cn(
        'bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden',
        isExpanded && 'ring-2',
      )}
      style={{
        borderRadius: '12px',
        backgroundColor: '#F5F0E1',
        // @ts-ignore
        '--tw-ring-color': isExpanded ? '#7CB342' : 'transparent',
      }}
    >
      <div className="p-4" onClick={onToggle}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold" style={{ color: '#5D4037' }}>
                {monthDay}
              </span>
              <span className="text-sm font-medium" style={{ color: '#8D6E63' }}>
                {weekday}
              </span>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" style={{ color: '#7CB342' }} />
          ) : (
            <ChevronDown className="w-5 h-5" style={{ color: '#8D6E63' }} />
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: '#7CB342' }}>
            {day.totalCalories} kcal
          </span>
          <div className="flex gap-1">
            {uniqueTags.map((tag) => {
              const mealType = (Object.keys(MEAL_TYPE_META) as PlanMeal['mealType'][]).find(
                (t) => MEAL_TYPE_META[t].shortLabel === tag,
              )!;
              return (
                <span
                  key={tag}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: MEAL_TYPE_META[mealType].color }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="蛋白" value={`${Math.round(day.totalProtein)}g`} color="#FF6B9D" />
          <MiniStat label="碳水" value={`${Math.round(day.totalCarbs)}g`} color="#FFB74D" />
          <MiniStat label="脂肪" value={`${Math.round(day.totalFat)}g`} color="#64B5F6" />
        </div>
      </div>

      {isExpanded && (
        <div
          className="px-4 pb-4 space-y-3 border-t"
          style={{ borderColor: '#E8E0CC' }}
          onClick={(e) => e.stopPropagation()}
        >
          {day.meals.map((meal) => (
            <MealSection
              key={meal.mealType}
              meal={meal}
              date={day.date}
              addedFoods={addedFoods}
              successFoods={successFoods}
              onAddFood={onAddFood}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="py-1.5 rounded-lg"
      style={{ backgroundColor: `${color}15` }}
    >
      <p className="text-xs" style={{ color }}>{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

interface MealSectionProps {
  meal: PlanMeal;
  date: string;
  addedFoods: Set<string>;
  successFoods: Set<string>;
  onAddFood: DateCardProps['onAddFood'];
}

function MealSection({ meal, date, addedFoods, successFoods, onAddFood }: MealSectionProps) {
  const meta = MEAL_TYPE_META[meal.mealType];
  const Icon = meta.icon;

  return (
    <div
      className="bg-white p-3 shadow-sm"
      style={{ borderRadius: '12px' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${meta.color}20` }}
          >
            <Icon className="w-4 h-4" style={{ color: meta.color }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#5D4037' }}>{meta.label}</p>
            <p className="text-[11px]" style={{ color: '#8D6E63' }}>{meal.mealName}</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full text-white"
          style={{ backgroundColor: meta.color }}>
          {meal.totalCalories} kcal
        </span>
      </div>

      <div className="space-y-2">
        {meal.foods.slice(0, 3).map((food) => {
          const k = keyOf({ date, mealType: meal.mealType, foodId: food.foodId });
          const isAdded = addedFoods.has(k);
          const isSuccess = successFoods.has(k);

          return (
            <div
              key={food.foodId}
              className="flex items-center justify-between p-2.5 rounded-lg"
              style={{ backgroundColor: '#FAF8F2' }}
            >
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-sm font-medium truncate" style={{ color: '#5D4037' }}>
                  {food.foodName}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: '#8D6E63' }}>
                  {food.quantity}g · {food.calories} kcal
                </p>
              </div>
              <AddFoodButton
                isAdded={isAdded}
                isSuccess={isSuccess}
                onClick={() => onAddFood(food, meal.mealType, date)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddFoodButton({
  isAdded,
  isSuccess,
  onClick,
}: {
  isAdded: boolean;
  isSuccess: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isAdded && !isSuccess}
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-white transition-all flex-shrink-0',
        !isAdded && 'hover:scale-110 active:scale-95',
        isSuccess && 'animate-scale-in',
      )}
      style={{
        backgroundColor: isSuccess ? '#4CAF50' : '#FF8A65',
        boxShadow: isSuccess
          ? '0 2px 8px rgba(76, 175, 80, 0.4)'
          : '0 2px 8px rgba(255, 138, 101, 0.4)',
      }}
    >
      {isSuccess ? (
        <Check className="w-4 h-4" />
      ) : isAdded ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Plus className="w-4 h-4" />
      )}
    </button>
  );
}
