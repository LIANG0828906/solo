import { v4 as uuidv4 } from 'uuid';
import { 
  WorkoutType, 
  GoalType, 
  WorkoutRecord, 
  PlanDay, 
  WeeklyPlan,
  WORKOUT_CALORIES_PER_MINUTE 
} from '../types';
import { getWeekDays } from './dateUtils';

interface PastWeekData {
  avgDailyCalories: number;
  typePreference: Record<WorkoutType, number>;
  totalWorkouts: number;
}

const WORKOUT_TYPES: WorkoutType[] = ['running', 'swimming', 'cycling', 'yoga', 'strength'];

function analyzePastWeek(records: WorkoutRecord[], weekStartDate: string): PastWeekData {
  const weekDays = getWeekDays(weekStartDate);
  const weekRecords = records.filter(r => weekDays.includes(r.date));
  
  const typeCounts: Record<WorkoutType, number> = {
    running: 0,
    swimming: 0,
    cycling: 0,
    yoga: 0,
    strength: 0,
  };
  
  let totalCalories = 0;
  
  weekRecords.forEach(record => {
    typeCounts[record.type]++;
    totalCalories += record.calories;
  });
  
  return {
    avgDailyCalories: weekDays.length > 0 ? totalCalories / 7 : 0,
    typePreference: typeCounts,
    totalWorkouts: weekRecords.length,
  };
}

function getTopPreferredTypes(preference: Record<WorkoutType, number>): WorkoutType[] {
  return [...WORKOUT_TYPES].sort((a, b) => preference[b] - preference[a]);
}

function getTargetDailyCalories(goal: GoalType, avgDaily: number): number {
  switch (goal) {
    case 'fat_loss':
      return Math.max(avgDaily * 1.3, 300);
    case 'muscle_gain':
      return Math.max(avgDaily * 1.1, 200);
    case 'maintain':
    default:
      return Math.max(avgDaily, 200);
  }
}

function assignIntensities(goal: GoalType): ('rest' | 'light' | 'moderate' | 'high')[] {
  switch (goal) {
    case 'fat_loss':
      return ['high', 'moderate', 'high', 'light', 'high', 'moderate', 'rest'];
    case 'muscle_gain':
      return ['high', 'moderate', 'rest', 'high', 'moderate', 'light', 'rest'];
    case 'maintain':
    default:
      return ['moderate', 'light', 'moderate', 'light', 'moderate', 'light', 'rest'];
  }
}

function getDurationForIntensity(intensity: string, baseDuration: number): number {
  switch (intensity) {
    case 'high':
      return Math.round(baseDuration * 1.5);
    case 'moderate':
      return baseDuration;
    case 'light':
      return Math.round(baseDuration * 0.6);
    case 'rest':
    default:
      return 0;
  }
}

function getTips(workoutType: WorkoutType, intensity: string): string[] {
  const tips: string[] = [];
  
  if (intensity === 'rest') {
    return ['今天是休息日，好好休息恢复', '可以做一些轻度拉伸', '保持充足睡眠'];
  }
  
  switch (workoutType) {
    case 'running':
      tips.push('跑前做好热身，跑后记得拉伸');
      tips.push('保持均匀呼吸，节奏稳定');
      if (intensity === 'high') tips.push('可以尝试间歇训练提高效率');
      break;
    case 'swimming':
      tips.push('游泳前做好热身运动');
      tips.push('注意补水，游泳也会出汗');
      if (intensity === 'high') tips.push('可以尝试不同泳姿轮换');
      break;
    case 'cycling':
      tips.push('调整好座椅高度，保护膝盖');
      tips.push('注意交通安全，遵守交通规则');
      if (intensity === 'high') tips.push('可以加入爬坡路段增加强度');
      break;
    case 'yoga':
      tips.push('选择安静舒适的环境');
      tips.push('动作循序渐进，不要勉强');
      tips.push('配合深呼吸效果更佳');
      break;
    case 'strength':
      tips.push('训练前充分热身');
      tips.push('注意动作标准，避免受伤');
      tips.push('组间休息60-90秒');
      if (intensity === 'high') tips.push('可以增加重量或减少组间休息');
      break;
  }
  
  tips.push('训练后记得补充蛋白质');
  
  return tips;
}

function getAlternatives(currentType: WorkoutType): WorkoutType[] {
  return WORKOUT_TYPES.filter(t => t !== currentType).slice(0, 2);
}

export function generateWeeklyPlan(
  weekStartDate: string,
  goal: GoalType,
  pastRecords: WorkoutRecord[]
): WeeklyPlan {
  const weekDays = getWeekDays(weekStartDate);
  const pastData = analyzePastWeek(pastRecords, weekStartDate);
  const preferredTypes = getTopPreferredTypes(pastData.typePreference);
  const targetDailyCalories = getTargetDailyCalories(goal, pastData.avgDailyCalories);
  const intensities = assignIntensities(goal);
  
  const baseDuration = Math.round(targetDailyCalories / 8);
  
  const days: PlanDay[] = weekDays.map((date, index) => {
    const intensity = intensities[index];
    
    if (intensity === 'rest') {
      return {
        date,
        workoutType: 'yoga',
        duration: 0,
        expectedCalories: 0,
        intensity: 'rest',
        tips: getTips('yoga', 'rest'),
        alternatives: [],
      };
    }
    
    const workoutType = preferredTypes[index % preferredTypes.length] || 'running';
    const duration = getDurationForIntensity(intensity, baseDuration);
    const expectedCalories = Math.round(duration * WORKOUT_CALORIES_PER_MINUTE[workoutType]);
    
    return {
      date,
      workoutType,
      duration,
      expectedCalories,
      intensity,
      tips: getTips(workoutType, intensity),
      alternatives: getAlternatives(workoutType),
    };
  });
  
  return {
    id: uuidv4(),
    weekStartDate,
    goal,
    days,
    createdAt: new Date().toISOString(),
  };
}
