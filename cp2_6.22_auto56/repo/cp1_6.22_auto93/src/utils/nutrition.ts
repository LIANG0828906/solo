import type { UserProfile, NutritionGoals, Food, FoodRecord, WeeklyMealPlan, MealPlanItem } from '@/types';

export function calculateBMR(profile: UserProfile): number {
  const { weight, height, age, gender } = profile;
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

export function calculateTDEE(profile: UserProfile): number {
  const bmr = calculateBMR(profile);
  return bmr * profile.activityLevel;
}

export function calculateNutritionGoals(profile: UserProfile): NutritionGoals {
  const tdee = calculateTDEE(profile);
  const calories = Math.round(tdee);
  const protein = Math.round((tdee * 0.25) / 4);
  const carbs = Math.round((tdee * 0.5) / 4);
  const fat = Math.round((tdee * 0.25) / 9);

  return { calories, protein, carbs, fat };
}

export function calculateDailyIntake(records: FoodRecord[]): Omit<NutritionGoals, 'calories'> & { calories: number } {
  return records.reduce(
    (acc, record) => ({
      calories: acc.calories + record.calories,
      protein: acc.protein + record.protein,
      carbs: acc.carbs + record.carbs,
      fat: acc.fat + record.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function calculateNutritionForAmount(food: Food, amount: number): Omit<FoodRecord, 'id' | 'foodId' | 'foodName' | 'amount' | 'mealType' | 'date' | 'time'> {
  const factor = amount / 100;
  return {
    protein: Number((food.protein * factor).toFixed(1)),
    carbs: Number((food.carbs * factor).toFixed(1)),
    fat: Number((food.fat * factor).toFixed(1)),
    calories: Math.round(food.calories * factor),
  };
}

export function getRemainingCalories(goals: NutritionGoals, intake: { calories: number }): number {
  return goals.calories - intake.calories;
}

export function getHeatmapColor(calories: number, maxCalories: number = 500): string {
  const ratio = Math.min(calories / maxCalories, 1);
  const r = Math.round(168 + (255 - 168) * ratio);
  const g = Math.round(213 - (213 - 140) * ratio);
  const b = Math.round(186 - (186 - 120) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

const mealTypeTargets = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack1: 0.05,
  snack2: 0.05,
};

export function generateWeeklyMealPlan(
  foods: Food[],
  goals: NutritionGoals,
  pastRecords: FoodRecord[]
): WeeklyMealPlan {
  const week: WeeklyMealPlan = [];
  const foodByCategory: Record<string, Food[]> = {
    '主食': foods.filter(f => f.category === '主食'),
    '肉类': foods.filter(f => f.category === '肉类'),
    '蔬菜': foods.filter(f => f.category === '蔬菜'),
    '水果': foods.filter(f => f.category === '水果'),
    '乳制品': foods.filter(f => f.category === '乳制品'),
  };

  const past7Days = new Date();
  past7Days.setDate(past7Days.getDate() - 7);
  const recentRecords = pastRecords.filter(
    r => new Date(r.date) >= past7Days
  );

  const avgIntake = recentRecords.length > 0
    ? calculateDailyIntake(recentRecords)
    : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const deficit = {
    calories: Math.max(0, goals.calories - avgIntake.calories / 7),
    protein: Math.max(0, goals.protein - avgIntake.protein / 7),
    carbs: Math.max(0, goals.carbs - avgIntake.carbs / 7),
    fat: Math.max(0, goals.fat - avgIntake.fat / 7),
  };

  for (let day = 0; day < 7; day++) {
    const dayPlan = {
      breakfast: [] as MealPlanItem[],
      lunch: [] as MealPlanItem[],
      dinner: [] as MealPlanItem[],
      snack1: [] as MealPlanItem[],
      snack2: [] as MealPlanItem[],
    };

    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'] as const;

    mealTypes.forEach(mealType => {
      const targetCalories = goals.calories * mealTypeTargets[mealType];
      const items: MealPlanItem[] = [];
      let currentCalories = 0;

      if (mealType === 'breakfast') {
        if (foodByCategory['主食'].length > 0) {
          const staple = foodByCategory['主食'][Math.floor(Math.random() * foodByCategory['主食'].length)];
          const amount = mealType === 'breakfast' ? 50 : 100;
          const nutrition = calculateNutritionForAmount(staple, amount);
          items.push({
            foodId: staple.id,
            foodName: staple.name,
            amount,
            calories: nutrition.calories,
          });
          currentCalories += nutrition.calories;
        }
        if (foodByCategory['乳制品'].length > 0) {
          const dairy = foodByCategory['乳制品'][Math.floor(Math.random() * foodByCategory['乳制品'].length)];
          const amount = 200;
          const nutrition = calculateNutritionForAmount(dairy, amount);
          items.push({
            foodId: dairy.id,
            foodName: dairy.name,
            amount,
            calories: nutrition.calories,
          });
          currentCalories += nutrition.calories;
        }
      } else if (mealType === 'lunch' || mealType === 'dinner') {
        if (foodByCategory['主食'].length > 0) {
          const staple = foodByCategory['主食'][Math.floor(Math.random() * foodByCategory['主食'].length)];
          const amount = 150;
          const nutrition = calculateNutritionForAmount(staple, amount);
          items.push({
            foodId: staple.id,
            foodName: staple.name,
            amount,
            calories: nutrition.calories,
          });
          currentCalories += nutrition.calories;
        }
        if (foodByCategory['肉类'].length > 0) {
          const meat = foodByCategory['肉类'][Math.floor(Math.random() * foodByCategory['肉类'].length)];
          const amount = 100;
          const nutrition = calculateNutritionForAmount(meat, amount);
          items.push({
            foodId: meat.id,
            foodName: meat.name,
            amount,
            calories: nutrition.calories,
          });
          currentCalories += nutrition.calories;
        }
        if (foodByCategory['蔬菜'].length > 0) {
          const veggie = foodByCategory['蔬菜'][Math.floor(Math.random() * foodByCategory['蔬菜'].length)];
          const amount = 150;
          const nutrition = calculateNutritionForAmount(veggie, amount);
          items.push({
            foodId: veggie.id,
            foodName: veggie.name,
            amount,
            calories: nutrition.calories,
          });
          currentCalories += nutrition.calories;
        }
      } else {
        if (foodByCategory['水果'].length > 0) {
          const fruit = foodByCategory['水果'][Math.floor(Math.random() * foodByCategory['水果'].length)];
          const amount = 100;
          const nutrition = calculateNutritionForAmount(fruit, amount);
          items.push({
            foodId: fruit.id,
            foodName: fruit.name,
            amount,
            calories: nutrition.calories,
          });
          currentCalories += nutrition.calories;
        }
      }

      if (deficit.protein > 0 && currentCalories < targetCalories * 0.8) {
        const highProtein = foods.filter(f => f.protein >= 10);
        if (highProtein.length > 0) {
          const pFood = highProtein[Math.floor(Math.random() * highProtein.length)];
          const amount = 50;
          const nutrition = calculateNutritionForAmount(pFood, amount);
          if (!items.some(i => i.foodId === pFood.id)) {
            items.push({
              foodId: pFood.id,
              foodName: pFood.name,
              amount,
              calories: nutrition.calories,
            });
          }
        }
      }

      dayPlan[mealType] = items;
    });

    week.push(dayPlan);
  }

  return week;
}

export const mealTypeLabels: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack1: '加餐1',
  snack2: '加餐2',
};

export const activityLevelLabels: Record<number, string> = {
  1.2: '久坐（几乎不运动）',
  1.375: '轻度活动（每周1-3天运动）',
  1.55: '中度活动（每周3-5天运动）',
  1.725: '高强度活动（每周6-7天运动）',
  1.9: '极高强度活动（专业运动员）',
};
