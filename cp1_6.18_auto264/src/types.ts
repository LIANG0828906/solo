export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  isCustom?: boolean;
}

export interface TrainingPlan {
  id: string;
  name: string;
  inviteCode: string;
  inviteExpiresAt: string;
  exercises: Exercise[];
  createdAt: string;
  studentName?: string;
}

export interface ExerciseLog {
  exerciseId: string;
  actualSets: number;
  completed: boolean;
}

export interface StudentStats {
  studentName: string;
  color: string;
  weekData: { date: string; completionRate: number }[];
  todayCompletion: number;
}

export type UserRole = 'coach' | 'client' | null;
