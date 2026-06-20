import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useStore } from '../store/useStore';
import { getRecipes, getMealPlans, addMealPlan, removeMealPlan, getDailySummary } from '../api/recipeApi';
import DraggableRecipe from '../components/DraggableRecipe';
import MealSlot from '../components/MealSlot';
import ProgressBar from '../components/ProgressBar';
import { Recipe, MealPlan, DailySummary, Nutrition } from '../types';

type MealType = 'breakfast' | 'lunch' | 'dinner';
const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];

const MealCalendar: React.FC = () => {
  const { recipes, setRecipes, mealPlans, setMealPlans, dailyGoal } = useStore();
  const [weekStart, setWeekStart] = useState(dayjs().startOf('week').add(1, 'day'));
  const [dailySummaries, setDailySummaries] = useState<Record<string, DailySummary>>({});
  const [loading, setLoading] = useState(true);

  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));
  };

  const weekDays = getWeekDays();
  const today = dayjs().format('YYYY-MM-DD');

  const loadData = async () => {
    setLoading(true);
    try {
      const [recipesData, mealPlansData] = await Promise.all([
        getRecipes(),
        getMealPlans(weekStart.format('YYYY-MM-DD')),
      ]);
      setRecipes(recipesData);
      setMealPlans(mealPlansData);

      const summaries: Record<string, DailySummary> = {};
      for (const day of weekDays) {
        try {
          const summary = await getDailySummary(day.format('YYYY-MM-DD'));
          summaries[day.format('YYYY-MM-DD')] = summary;
        } catch (e) {
          console.error('Failed to load summary:', e);
        }
      }
      setDailySummaries(summaries);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [weekStart]);

  const getRecipeForSlot = (date: string, mealType: MealType): Recipe | undefined => {
    const plan = mealPlans.find((p) => p.date === date && p.mealType === mealType);
    if (plan) {
      return recipes.find((r) => r.id === plan.recipeId);
    }
    return undefined;
  };

  const getMealPlanId = (date: string, mealType: MealType): string | undefined => {
    const plan = mealPlans.find((p) => p.date === date && p.mealType === mealType);
    return plan?.id;
  };

  const handleDrop = async (date: string, mealType: MealType, recipeId: string) => {
    try {
      const existingId = getMealPlanId(date, mealType);
      if (existingId) {
        await removeMealPlan(existingId);
      }
      const newPlan = await addMealPlan({ date, mealType, recipeId });
      setMealPlans([
        ...mealPlans.filter((p) => !(p.date === date && p.mealType === mealType)),
        newPlan,
      ]);
      const summary = await getDailySummary(date);
      setDailySummaries({ ...dailySummaries, [date]: summary });
    } catch (error) {
      console.error('Failed to add meal plan:', error);
    }
  };

  const handleRemove = async (date: string, mealType: MealType) => {
    try {
      const planId = getMealPlanId(date, mealType);
      if (planId) {
        await removeMealPlan(planId);
        setMealPlans(mealPlans.filter((p) => p.id !== planId));
        const summary = await getDailySummary(date);
        setDailySummaries({ ...dailySummaries, [date]: summary });
      }
    } catch (error) {
      console.error('Failed to remove meal plan:', error);
    }
  };

  const selectedDate = today;
  const currentSummary = dailySummaries[selectedDate];
  const currentNutrition: Nutrition = currentSummary
    ? currentSummary.nutrition
    : { calories: 0, protein: 0, fat: 0, carbs: 0 };

  const goToPrevWeek = () => setWeekStart(weekStart.subtract(1, 'week'));
  const goToNextWeek = () => setWeekStart(weekStart.add(1, 'week'));
  const goToThisWeek = () => setWeekStart(dayjs().startOf('week').add(1, 'day'));

  return (
    <div className="meal-calendar-page">
      <div className="meal-calendar-layout">
        <div className="meal-calendar-left">
          <div className="content-panel meal-calendar-recipes">
            <h2 className="meal-calendar-section-title">食谱库</h2>
            <div className="meal-calendar-recipe-list">
              {recipes.map((recipe) => (
                <DraggableRecipe key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>
        </div>

        <div className="meal-calendar-center">
          <div className="content-panel meal-calendar-calendar">
            <div className="meal-calendar-header">
              <button className="btn btn-secondary" onClick={goToPrevWeek}>
                ← 上一周
              </button>
              <h2 className="meal-calendar-week-title">
                {weekStart.format('YYYY年M月D日')} - {weekStart.add(6, 'day').format('M月D日')}
              </h2>
              <div className="meal-calendar-header-buttons">
                <button className="btn btn-secondary" onClick={goToThisWeek}>
                  本周
                </button>
                <button className="btn btn-secondary" onClick={goToNextWeek}>
                  下一周 →
                </button>
              </div>
            </div>
            <div className="meal-calendar-grid">
              <div className="meal-calendar-grid-header">
                <div className="meal-calendar-corner" />
                {weekDays.map((day) => {
                  const dateStr = day.format('YYYY-MM-DD');
                  const isToday = dateStr === today;
                  return (
                    <div
                      key={dateStr}
                      className={`meal-calendar-day-header${isToday ? ' meal-calendar-today' : ''}`}
                    >
                      <div className="meal-calendar-day-weekday">{day.format('ddd')}</div>
                      <div className={`meal-calendar-day-date${isToday ? ' meal-calendar-date-today' : ''}`}>
                        {day.format('D')}
                      </div>
                    </div>
                  );
                })}
              </div>
              {mealTypes.map((mealType) => (
                <React.Fragment key={mealType}>
                  <div className="meal-calendar-meal-label">
                    {mealType === 'breakfast' && '早餐'}
                    {mealType === 'lunch' && '午餐'}
                    {mealType === 'dinner' && '晚餐'}
                  </div>
                  {weekDays.map((day) => {
                    const dateStr = day.format('YYYY-MM-DD');
                    const recipe = getRecipeForSlot(dateStr, mealType);
                    return (
                      <MealSlot
                        key={`${dateStr}-${mealType}`}
                        date={dateStr}
                        mealType={mealType}
                        recipe={recipe}
                        onDrop={handleDrop}
                        onRemove={handleRemove}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="meal-calendar-right">
          <div className="content-panel meal-calendar-summary">
            <h2 className="meal-calendar-section-title">营养汇总</h2>
            <div className="meal-calendar-summary-date">
              {dayjs(selectedDate).format('YYYY年M月D日')}
            </div>
            <div className="meal-calendar-progress-list">
              <ProgressBar
                current={Math.round(currentNutrition.calories)}
                goal={dailyGoal.calories}
                label="卡路里 (kcal)"
              />
              <ProgressBar
                current={Math.round(currentNutrition.protein)}
                goal={dailyGoal.protein}
                label="蛋白质 (g)"
              />
              <ProgressBar
                current={Math.round(currentNutrition.fat)}
                goal={dailyGoal.fat}
                label="脂肪 (g)"
              />
              <ProgressBar
                current={Math.round(currentNutrition.carbs)}
                goal={dailyGoal.carbs}
                label="碳水化合物 (g)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealCalendar;
