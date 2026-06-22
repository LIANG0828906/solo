export type GoalType = 'muscle' | 'fat-loss' | 'maintain';
export type LocationType = 'home' | 'gym';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface Client {
  id: string;
  name: string;
  age: number;
  goal: GoalType;
  location: LocationType;
  baselineScores: BaselineScores;
  createdAt: string;
}

export interface BaselineScores {
  squat: number;
  pushup: number;
  plank: number;
  flexibility: number;
  endurance: number;
}

export const BASELINE_QUESTIONS = [
  { key: 'squat', label: '深蹲最大次数', description: '自重深蹲在标准姿势下最多能完成的次数' },
  { key: 'pushup', label: '俯卧撑连续次数', description: '标准俯卧撑在不休息情况下连续完成次数' },
  { key: 'plank', label: '平板支撑时长', description: '标准平板支撑能坚持的时间(秒)' },
  { key: 'flexibility', label: '柔韧性自评', description: '1-10分，能否轻松摸到脚趾' },
  { key: 'endurance', label: '有氧耐力自评', description: '1-10分，跑步/骑车持续运动能力' },
] as const;

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  mediaUrl: string;
  difficulty: DifficultyLevel;
  description: string;
}

export const MUSCLE_GROUPS = [
  '胸部', '背部', '肩部', '手臂', '核心', '腿部', '臀部', '全身',
] as const;

export interface PlanExercise {
  exerciseId: string;
  sets: number;
  reps: string;
  restSeconds: number;
  order: number;
}

export interface PlanDay {
  dayIndex: number;
  duration: number;
  focusAreas: string[];
  exercises: PlanExercise[];
}

export interface TrainingPlan {
  id: string;
  clientId: string;
  weekStart: string;
  days: PlanDay[];
  createdAt: string;
}

export interface CompletedExercise {
  exerciseId: string;
  completedSets: number;
  completedReps: number[];
  completedAt: string;
}

export interface SelfAssessment {
  sleepQuality: number;
  soreAreas: string[];
  energyLevel: number;
}

export interface Session {
  id: string;
  planId: string;
  clientId: string;
  date: string;
  dayIndex: number;
  completedExercises: CompletedExercise[];
  selfAssessment: SelfAssessment | null;
  startedAt: string | null;
  completedAt: string | null;
  totalDuration: number;
}

export interface WeeklyReport {
  id: string;
  clientId: string;
  weekKey: string;
  completionRate: number;
  avgDuration: number;
  totalCalories: number;
  progressCurves: ProgressCurve[];
  assessmentTrend: AssessmentTrend[];
  currentAssessment: BaselineScores;
  previousAssessment: BaselineScores;
  suggestions: string[];
  generatedAt: string;
}

export interface ProgressCurve {
  exerciseName: string;
  data: { day: string; value: number }[];
}

export interface AssessmentTrend {
  date: string;
  sleepQuality: number;
  energyLevel: number;
  soreCount: number;
}

export interface DatabaseSchema {
  clients: Client[];
  exercises: Exercise[];
  trainingPlans: TrainingPlan[];
  sessions: Session[];
  weeklyReports: WeeklyReport[];
}

export interface AdjustRequest {
  selfAssessment: SelfAssessment;
  dayIndex: number;
}
