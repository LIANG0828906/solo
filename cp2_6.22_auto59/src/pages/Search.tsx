import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import FoodSearch from '@/components/FoodSearch';
import ReminderBanner from '@/components/ReminderBanner';
import { useNutritionStore } from '@/store/useNutritionStore';

export default function Search() {
  const { fetchTodayLogs, fetchGoals } = useNutritionStore();

  useEffect(() => {
    fetchTodayLogs();
    fetchGoals();
  }, [fetchTodayLogs, fetchGoals]);

  return (
    <div className="min-h-screen bg-surface-bg">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <ReminderBanner />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">添加食物</h1>
          <p className="text-sm text-gray-500 mt-1">
            搜索并添加你今天吃的食物，记录营养摄入
          </p>
        </div>
        <div className="bg-surface-card rounded-2xl shadow-card p-5 sm:p-6">
          <FoodSearch />
        </div>
      </main>
    </div>
  );
}
