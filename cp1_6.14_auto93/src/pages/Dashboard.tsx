import { useEffect } from 'react';
import { useNutritionStore } from '@/store/nutrition';
import MealCard from '@/components/MealCard';
import MealForm from '@/components/MealForm';
import Empty from '@/components/Empty';

export default function Dashboard() {
  const { meals, loading, fetchMeals, fetchDailyNutrition, fetchProfile } = useNutritionStore();
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

  const mealLabels: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">今日饮食</h1>
          <p className="mt-1 text-sm text-gray-500">
            {new