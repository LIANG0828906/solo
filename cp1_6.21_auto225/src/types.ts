export interface User {
  id: string;
  username: string;
}

export interface Exercise {
  id: string;
  name: string;
  defaultSets: number;
  minReps: number;
  maxReps: number;
  order: number;
}

export interface TrainingPlan {
  id: string;
  userId: string;
  name: string;
  exercises: Exercise[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SetRecord {
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number;
  note: string;
}

export interface ExerciseRecord {
  exerciseId: string;
  exerciseName: string;
  sets: SetRecord[];
}

export interface TrainingRecord {
  id: string;
  userId: string;
  planId: string;
  date: string;
  exerciseRecords: ExerciseRecord[];
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null, token?: string | null) => void;
  logout: () => void;
}
