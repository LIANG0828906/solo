import { useNutritionStore } from '@/store/useNutritionStore';
import { Trash2, UtensilsCrossed, Coffee, Sun, Moon, Cookie } from 'lucide-react';
import type { MealType, FoodLogEntry } from '@/types';
import { cn } from '@/lib/utils';

const MEAL_CONFIG: Record<
  MealType,
  { label: string; icon: typeof Coffee; color: string; bg: string }
> = {
  breakfast: {
    label: '早餐',
    icon: Coffee,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  lunch: {
    label: '午餐',
    icon: Sun,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  dinner: {
    label: '晚餐',
    icon: Moon,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  snack: {
    label: '加餐',
    icon: Cookie,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
  },
};

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface LogItemProps {
  entry: FoodLogEntry;
  isNew?: boolean;
}

function LogItem({ entry, isNew }: LogItemProps) {
  const { removeFoodEntry, lastAddedId } = useNutritionStore();
  const mealCfg = MEAL_CONFIG[entry.mealType];

  const shouldAnimate = isNew || lastAddedId === entry.id;

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-xl bg-white border border-surface-border',
        'hover:shadow-card-hover hover:border-primary-200 transition-all duration-300',
        shouldAnimate && 'animate-slide-in-bottom',
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          mealCfg.bg,
        )}
      >
        <UtensilsCrossed className={cn('w-5 h-5', mealCfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800 truncate">
            {entry.foodName}
          </span>
          <span
            className={cn(
              'text-xs px-1.5 py-0.5 rounded-md flex-shrink-0',
              mealCfg.bg,
              mealCfg.color,
            )}
          >
            {mealCfg.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
          <span>{entry.amount}g</span>
          <span>•</span>
          <span className="tabular-nums">
            蛋白质 {entry.protein.toFixed(0)}g
          </span>
          <span>•</span>
          <span className="tabular-nums">{entry.calories.toFixed(0)} kcal</span>
        </div>
      </div>
      <button
        onClick={() => removeFoodEntry(entry.id)}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          'text-gray-400 hover:text-red-500 hover:bg-red-50',
          'opacity-0 group-hover:opacity-100 transition-all duration-200',
          'active:scale-90',
        )}
        aria-label="删除记录"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function DietLog() {
  const { todayLogs } = useNutritionStore();

  const grouped = MEAL_ORDER.reduce((acc, meal) => {
    acc[meal] = todayLogs.filter((l) => l.mealType === meal);
    return acc;
  }, {} as Record<MealType, FoodLogEntry[]>);

  const hasAny = todayLogs.length > 0;

  return (
    <div className="bg-surface-card rounded-2xl shadow-card p-5 h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-base font-bold text-gray-800">今日饮食日志</h3>
        <span className="text-xs text-gray-400">共 {todayLogs.length} 条</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
        {!hasAny && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <UtensilsCrossed className="w-14 h-14 mb-3 opacity-30" />
            <p className="text-sm">还没有记录</p>
            <p className="text-xs mt-1">去添加今天的第一餐吧</p>
          </div>
        )}
        {MEAL_ORDER.map((meal) => {
          const items = grouped[meal];
          if (items.length === 0) return null;
          const cfg = MEAL_CONFIG[meal];
          const Icon = cfg.icon;
          const mealCals = items.reduce((s, i) => s + i.calories, 0);
          return (
            <div key={meal}>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <Icon className={cn('w-4 h-4', cfg.color)} />
                  <span className={cn('text-sm font-semibold', cfg.color)}>
                    {cfg.label}
                  </span>
                </div>
                <span className="text-xs text-gray-400 tabular-nums">
                  {mealCals.toFixed(0)} kcal
                </span>
              </div>
              <div className="space-y-2">
                {items.map((entry) => (
                  <LogItem key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
