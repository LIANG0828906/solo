export interface Plan {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  createdAt: number;
}

export interface Exercise {
  id: string;
  name: string;
  presetId: string;
  order: number;
}

export interface Workout {
  id: string;
  planId: string;
  planName: string;
  date: number;
  duration: number;
  exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface User {
  id: string;
  name: string;
  avatarInitial: string;
}

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  workoutId: string;
  date: number;
  likes: number;
  liked: boolean;
  comments: Comment[];
  workout: Workout;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  date: number;
}

export interface PresetExercise {
  id: string;
  name: string;
  category: string;
}

export type Page = 'plans' | 'workout' | 'social';
