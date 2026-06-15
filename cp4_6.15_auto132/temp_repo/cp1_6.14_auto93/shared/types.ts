export interface Food {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
}

export interface MealEntry {
  id: string;
  foodId: string;
  foodName: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  height: number;
  currentWeight: number;
  targetWeight: number;
  activityLevel: number;
  goal: 'lose' | 'gain' | 'maintain';
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

export interface DailyNutrition {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

export interface PlanMeal {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack-morning' | 'snack-afternoon';
  mealName: string;
  foods: {
    foodId: string;
    foodName: string;
    quantity: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface DayPlan {
  date: string;
  dayOfWeek: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: PlanMeal[];
}

export interface WeeklyPlan {
  id: string;
  startDate: string;
  endDate: string;
  days: DayPlan[];
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  password: string;
  profile: UserProfile;
}
