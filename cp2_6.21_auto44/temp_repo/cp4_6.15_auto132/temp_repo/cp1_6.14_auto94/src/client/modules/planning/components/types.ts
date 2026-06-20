export interface AdjustmentInfo {
  type: 'reduced' | 'increased';
  reason: string;
}

export interface PlanExerciseWithDetails {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  difficulty: number;
  sets: number;
  reps: string;
  restSeconds: number;
  order: number;
  adjustment?: AdjustmentInfo;
}

export interface CreatePlanFormData {
  clientId: string;
  trainingDays: number[];
  duration: number;
  focusAreas: string[];
}

export const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const;
