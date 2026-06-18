/**
 * ============================================================
 *  types/index.ts - TypeScript 类型定义模块
 * ============================================================
 * 
 * 【职责】：
 *  定义所有跨组件共享的 TypeScript 接口、类型别名
 *  保证各模块数据结构的一致性与类型安全
 * 
 * 【被引用关系】：
 *  ┌───────────────────────┐     ┌───────────────────────┐
 *  │   App.tsx             │     │ utils/calculateNu...  │
 *  │  - MealEntry[]        │     │  - FoodNutrient       │
 *  │  - NutritionGoals     │     │  - MealEntry          │
 *  │  - DailyTotal         │     │  - MealFormData       │
 *  │  - GoalStatus         │     │  - DailyTotal         │
 *  └──────────┬────────────┘     └──────────┬────────────┘
 *             │                             │
 *             └──────────────┬──────────────┘
 *                            ▼
 *                 ┌──────────────────────┐
 *                 │   components/*.tsx   │
 *                 │ MealForm             │
 *                 │  - MealFormData      │
 *                 │  - MealEntry         │
 *                 │ NutrientChart        │
 *                 │  - DailyTotal        │
 *                 │  - NutritionGoals    │
 *                 │  - GoalStatus        │
 *                 │ MealLogList          │
 *                 │  - MealEntry[]       │
 *                 │ GoalSetting          │
 *                 │  - NutritionGoals    │
 *                 └──────────────────────┘
 * 
 * 【类型依赖关系】：
 *  FoodNutrient (内置数据库)
 *      ↓ 查询
 *  MealFormData (用户输入) → calculateMealNutrients → MealEntry
 *                                                      ↓
 *  MealEntry[] (数组) → calculateDailyTotal → DailyTotal
 *                                                      ↓
 *  DailyTotal + NutritionGoals → GoalStatus (达标判断)
 * ============================================================
 */

export interface FoodNutrient {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
}

export interface MealEntry {
  id: string;
  foodName: string;
  grams: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  timestamp: number;
  isNew?: boolean;
}

export interface NutritionGoals {
  dailyCalories: number;
  minProtein: number;
  maxFat: number;
  maxCarbs: number;
}

export interface DailyTotal {
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
}

export interface MealFormData {
  foodName: string;
  grams: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface GoalStatus {
  calories: boolean;
  protein: boolean;
  fat: boolean;
  carbs: boolean;
}

export type NutrientType = 'protein' | 'fat' | 'carbs';
