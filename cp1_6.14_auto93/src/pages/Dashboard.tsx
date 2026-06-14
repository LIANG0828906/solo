import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Flame } from 'lucide-react';
import { useNutritionStore } from '@/store/nutrition';
import Layout from '@/components/Layout';
import MealCard from '@/components/MealCard';
import MealForm from '@/components/MealForm';
import NutrientRing from '@/components/NutrientRing';
import ProgressBar from '@/components/ProgressBar';
import Empty from '@/components/Empty';
import { cn } from '@/lib/utils';

interface MealSectionProps {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealLabel: string;
  meals: Array<{ id: string; [key: string]: unknown }>;
  date: string;
  onDelete: (id: string) => void;
  onAdded: () => void;
}

function MealSection({ mealType, mealLabel, meals, date, onDelete, onAdded }: MealSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      className="bg-white shadow-sm overflow-hidden"
      style={{ borderRadius: '12px' }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#F5F0E1' }}
          >
            <Flame className="w-5 h-5" style={{ color: '#FF8A65' }} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-800">{mealLabel}</h3>
            <p className="text-xs text-gray-500">{meals.length} 条记录</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-4">
          <MealForm date={date} mealType={mealType} mealLabel={mealLabel} onAdded={onAdded} />

          {meals.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {meals.map((meal, index) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  index={index}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ) : (
            <div className="py-8">
              <Empty />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RightPanel() {
  const { dailyNutrition, profile } = useNutritionStore();

  const protein = {
    current: dailyNutrition?.protein ?? 0,
    target: dailyNutrition?.targetProtein ?? profile?.targetProtein ?? 0,
  };

  const carbs = {
    current: dailyNutrition?.carbs ?? 0,
    target: dailyNutrition?.targetCarbs ?? profile?.targetCarbs ?? 0,
  };

  const fat = {
    current: dailyNutrition?.fat ?? 0,
    target: dailyNutrition?.targetFat ?? profile?.targetFat ?? 0,
  };

  const currentCalories = dailyNutrition?.calories ?? 0;
  const targetCalories = dailyNutrition?.targetCalories ?? profile?.targetCalories ?? 0;

  return (
    <div className="space-y-4">
      <div
        className="bg-white shadow-sm p-5"
        style={{ borderRadius: '12px' }}
      >
        <h3 className="font-semibold text-gray-800 mb-4">今日概览</h3>
        <NutrientRing protein={protein} carbs={carbs} fat={fat} size={200} strokeWidth={12} />
      </div>

      <div
        className="bg-white shadow-sm p-5"
        style={{ borderRadius: '12px' }}
      >
        <ProgressBar
          current={currentCalories}
          target={targetCalories}
          label="热量摄入"
        />
      </div>

      <div
        className="bg-white shadow-sm p-5 space-y-3"
        style={{ borderRadius: '12px' }}
      >
        <h3 className="font-semibold text-gray-800">营养概览</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF6B9D' }} />
            <span className="text-sm text-gray-600">蛋白质</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold" style={{ color: '#FF6B9D' }}>
              {Math.round(protein.current)}g
            </span>
            <span className="text-xs text-gray-400 ml-1">/ {Math.round(protein.target)}g</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFB74D' }} />
            <span className="text-sm text-gray-600">碳水化合物</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold" style={{ color: '#FFB74D' }}>
              {Math.round(carbs.current)}g
            </span>
            <span className="text-xs text-gray-400 ml-1">/ {Math.round(carbs.target)}g</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#64B5F6' }} />
            <span className="text-sm text-gray-600">脂肪</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold" style={{ color: '#64B5F6' }}>
              {Math.round(fat.current)}g
            </span>
            <span className="text-xs text-gray-400 ml-1">/ {Math.round(fat.target)}g</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { meals, fetchMeals, fetchDailyNutrition, fetchProfile, removeMeal } = useNutritionStore();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchProfile();
    fetchDailyNutrition(today);
    fetchMeals(today);
  }, [fetchProfile, fetchDailyNutrition, fetchMeals, today]);

  const groupedMeals = {
    breakfast: meals.filter((m) => m.mealType === 'breakfast'),
    lunch: meals.filter((m) => m.mealType === 'lunch'),
    dinner: meals.filter((m) => m.mealType === 'dinner'),
    snack: meals.filter((m) => m.mealType === 'snack'),
  };

  const mealSections: Array<{ type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; label: string }> = [
    { type: 'breakfast', label: '早餐' },
    { type: 'lunch', label: '午餐' },
    { type: 'dinner', label: '晚餐' },
    { type: 'snack', label: '加餐' },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`;
  };

  const handleDelete = async (id: string) => {
    await removeMeal(id);
  };

  const handleMealAdded = () => {
    fetchMeals(today);
    fetchDailyNutrition(today);
  };

  return (
    <Layout rightPanel={<RightPanel />} activeNav="/">
      <div className="space-y-6 animate-fade-in-up max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">今日饮食记录</h1>
          <p className="mt-1 text-sm text-gray-500">{formatDate(today)}</p>
        </div>

        <div className="space-y-4">
          {mealSections.map((section) => (
            <MealSection
              key={section.type}
              mealType={section.type}
              mealLabel={section.label}
              meals={groupedMeals[section.type]}
              date={today}
              onDelete={handleDelete}
              onAdded={handleMealAdded}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
