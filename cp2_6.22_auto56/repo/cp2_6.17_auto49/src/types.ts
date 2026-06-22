export type WorkoutType = 'running' | 'swimming' | 'cycling' | 'yoga' | 'strength';

export type GoalType = 'fat_loss' | 'muscle_gain' | 'maintain';

export interface WorkoutRecord {
  id: string;
  date: string;
  type: WorkoutType;
  duration: number;
  calories: number;
  createdAt: string;
}

export interface MealRecord {
  id: string;
  date: string;
  foodName: string;
  portion: number;
  calories: number;
  createdAt: string;
}

export interface PlanDay {
  date: string;
  workoutType: WorkoutType;
  duration: number;
  expectedCalories: number;
  intensity: 'rest' | 'light' | 'moderate' | 'high';
  tips: string[];
  alternatives: WorkoutType[];
}

export interface WeeklyPlan {
  id: string;
  weekStartDate: string;
  goal: GoalType;
  days: PlanDay[];
  createdAt: string;
}

export interface UserSettings {
  id: string;
  goal: GoalType;
  dailyDurationGoal: number;
  nickname: string;
}

export interface DailyStats {
  date: string;
  burnedCalories: number;
  consumedCalories: number;
  workoutDuration: number;
}

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  running: '跑步',
  swimming: '游泳',
  cycling: '骑行',
  yoga: '瑜伽',
  strength: '力量训练',
};

export const GOAL_LABELS: Record<GoalType, string> = {
  fat_loss: '减脂',
  muscle_gain: '增肌',
  maintain: '维持',
};

export const WORKOUT_CALORIES_PER_MINUTE: Record<WorkoutType, number> = {
  running: 10,
  swimming: 12,
  cycling: 8,
  yoga: 5,
  strength: 7,
};
