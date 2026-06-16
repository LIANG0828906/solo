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

export interface LogFormExercise {
  exerciseId: string;
  exerciseName: string;
  category: ExerciseCategory;
  sets: number;
  reps: number;
  weight: number;
}

export interface LogFormState {
  date: string;
  time: string;
  exercises: LogFormExercise[];
}

export interface SearchIndex {
  nameIndex: Map<string, string[]>;
  categoryIndex: Map<string, string[]>;
  exerciseMap: Map<string, Exercise>;
}
