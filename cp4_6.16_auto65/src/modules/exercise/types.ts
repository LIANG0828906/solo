export type ExerciseCategory = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

export type ExerciseType = 'free' | 'machine' | 'bodyweight';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  type: ExerciseType;
  description: string;
  createdAt: number;
}

export interface TrainingRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: ExerciseCategory;
  sets: number;
  reps: number;
  weight: number;
  totalWeight: number;
  date: string;
  time: string;
  createdAt: number;
}

export interface TemplateExercise {
  exerciseId: string;
  exerciseName: string;
  category: ExerciseCategory;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
}

export interface TrainingTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  createdAt: number;
}

export interface ExerciseStore {
  exercises: Exercise[];
  trainingRecords: TrainingRecord[];
  templates: TrainingTemplate[];
  addExercise: (exercise: Omit<Exercise, 'id' | 'createdAt'>) => void;
  updateExercise: (id: string, exercise: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  addTrainingRecord: (record: Omit<TrainingRecord, 'id' | 'createdAt'>) => void;
  deleteTrainingRecord: (id: string) => void;
  addTemplate: (template: Omit<TrainingTemplate, 'id' | 'createdAt'>) => void;
  updateTemplate: (id: string, template: Partial<TrainingTemplate>) => void;
  deleteTemplate: (id: string) => void;
  loadExercises: () => Promise<void>;
  loadTrainingRecords: () => Promise<void>;
  loadTemplates: () => Promise<void>;
}
