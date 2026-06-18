/**
 * ============================================================
 *  App.tsx - 主应用组件
 * ============================================================
 * 
 * 【职责】：
 *  1. 全局状态管理：meals(餐食列表)、goals(营养目标)
 *  2. 汇总计算：每日营养总量、达标状态
 *  3. 页面布局：左侧表单区(40%) + 右侧图表+日志区(60%)
 *  4. 事件分发：将回调传递给子组件
 * 
 * 【调用关系】：
 *  ╔══════════════════════════════════════════════════╗
 *  ║                    App.tsx                       ║
 *  ║  ┌─────────────┐    ┌─────────────────────────┐  ║
 *  ║  │ MealForm    │───▶│ onAddMeal(meal)         │  ║
 *  ║  │ (输入餐食)  │    │ setMeals([meal, ...])   │  ║
 *  ║  └─────────────┘    └────────────┬────────────┘  ║
 *  ║                                   │               ║
 *  ║  ┌──────────────┐   ┌────────────▼────────────┐  ║
 *  ║  │ GoalSetting  │──▶│ onUpdateGoals(partial)  │  ║
 *  ║  │ (设置目标)   │   │ setGoals(merge)         │  ║
 *  ║  └──────────────┘   └────────────┬────────────┘  ║
 *  ║                                   │               ║
 *  ║                                   ▼               ║
 *  ║  ┌────────────────────────────────────────────┐   ║
 *  ║  │  useMemo: dailyTotal = calculateDailyTotal │   ║
 *  ║  │  useMemo: goalStatus = compare(goals)      │   ║
 *  ║  └─────────────┬──────────────────┬───────────┘   ║
 *  ║                │                  │               ║
 *  ║                ▼                  ▼               ║
 *  ║  ┌───────────────┐   ┌──────────────────┐        ║
 *  ║  │ NutrientChart │   │ MealLogList      │        ║
 *  ║  │ (props传值)   │   │  ├─ meals[]       │        ║
 *  ║  │  ├─ dailyTotal│   │  └─ onDeleteMeal │        ║
 *  ║  │  ├─ goals     │   └──────────────────┘        ║
 *  ║  │  └─ goalStatus│                               ║
 *  ║  └───────────────┘                               ║
 *  ╚══════════════════════════════════════════════════╝
 * 
 * 【数据流向】：
 *  用户输入 → MealForm → calculateMealNutrients → App state
 *    → calculateDailyTotal → dailyTotal + goalStatus
 *    → 分别传给 NutrientChart / MealLogList 渲染
 * ============================================================
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { MealEntry, NutritionGoals, DailyTotal, GoalStatus } from './types';
import { calculateDailyTotal } from './utils/calculateNutrients';
import MealForm from './components/MealForm';
import NutrientChart from './components/NutrientChart';
import MealLogList from './components/MealLogList';
import GoalSetting from './components/GoalSetting';

const DEFAULT_GOALS: NutritionGoals = {
  dailyCalories: 2000,
  minProtein: 60,
  maxFat: 65,
  maxCarbs: 250,
};

function App() {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);

  const dailyTotal: DailyTotal = useMemo(() => {
    const start = performance.now();
    const result = calculateDailyTotal(meals);
    const end = performance.now();
    if (import.meta.env.DEV) {
      console.log(`[Performance] 营养计算耗时: ${(end - start).toFixed(2)}ms`);
    }
    return result;
  }, [meals]);

  const goalStatus: GoalStatus = useMemo(() => ({
    calories: dailyTotal.totalCalories <= goals.dailyCalories,
    protein: dailyTotal.totalProtein >= goals.minProtein,
    fat: dailyTotal.totalFat <= goals.maxFat,
    carbs: dailyTotal.totalCarbs <= goals.maxCarbs,
  }), [dailyTotal, goals]);

  const handleAddMeal = useCallback((meal: MealEntry) => {
    const start = performance.now();
    
    setMeals(prevMeals => {
      const updatedMeals = [meal, ...prevMeals].map(m => ({ ...m, isNew: m.id === meal.id }));
      
      setTimeout(() => {
        setMeals(current => 
          current.map(m => ({ ...m, isNew: false }))
        );
      }, 1000);
      
      return updatedMeals;
    });

    const end = performance.now();
    if (import.meta.env.DEV) {
      console.log(`[Performance] 添加餐食总耗时: ${(end - start).toFixed(2)}ms`);
    }
  }, []);

  const handleDeleteMeal = useCallback((mealId: string) => {
    setMeals(prevMeals => prevMeals.filter(m => m.id !== mealId));
  }, []);

  const handleUpdateGoals = useCallback((newGoals: Partial<NutritionGoals>) => {
    setGoals(prev => ({ ...prev, ...newGoals }));
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV && meals.length > 0) {
      const start = performance.now();
      requestAnimationFrame(() => {
        const end = performance.now();
        console.log(`[Performance] 渲染更新耗时: ${(end - start).toFixed(2)}ms`);
      });
    }
  }, [meals, dailyTotal]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🥗 饮食日志仪表盘</h1>
        <p>记录每一餐，科学管理您的营养摄入</p>
      </header>

      <div className="dashboard-layout">
        <div className="left-panel">
          <div className="card">
            <h2 className="section-title">📝 记录饮食</h2>
            <MealForm onAddMeal={handleAddMeal} />
          </div>
          
          <div className="card" style={{ marginTop: '24px' }}>
            <h2 className="section-title">🎯 营养目标设置</h2>
            <GoalSetting 
              currentGoals={goals} 
              onUpdateGoals={handleUpdateGoals} 
            />
          </div>
        </div>

        <div className="right-panel">
          <div className="card">
            <h2 className="section-title">📊 今日营养概览</h2>
            <NutrientChart 
              dailyTotal={dailyTotal} 
              goals={goals}
              goalStatus={goalStatus}
            />
          </div>

          <div className="card">
            <h2 className="section-title">📋 今日饮食记录</h2>
            <MealLogList 
              meals={meals} 
              onDeleteMeal={handleDeleteMeal}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
