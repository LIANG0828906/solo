import { WorkoutType, WORKOUT_CALORIES_PER_MINUTE } from '../types';

export function calculateWorkoutCalories(type: WorkoutType, duration: number): number {
  const perMinute = WORKOUT_CALORIES_PER_MINUTE[type] || 5;
  return Math.round(perMinute * duration);
}

export function calculateMealCalories(foodName: string, portion: number): number {
  const baseCalories: Record<string, number> = {
    '米饭': 116,
    '鸡胸肉': 165,
    '牛肉': 250,
    '鸡蛋': 155,
    '牛奶': 54,
    '面包': 265,
    '面条': 138,
    '蔬菜沙拉': 50,
    '水果': 50,
    '鱼': 200,
  };
  
  const base = baseCalories[foodName] || 100;
  return Math.round(base * portion / 100);
}

export function estimateFoodCalories(foodName: string): number {
  const estimates: Record<string, number> = {
    '米饭': 116,
    '鸡胸肉': 165,
    '牛肉': 250,
    '鸡蛋': 155,
    '牛奶': 54,
    '面包': 265,
    '面条': 138,
    '沙拉': 50,
    '水果': 50,
    '鱼': 200,
    '蔬菜': 30,
    '豆腐': 76,
  };
  
  for (const [key, value] of Object.entries(estimates)) {
    if (foodName.includes(key)) {
      return value;
    }
  }
  return 100;
}
