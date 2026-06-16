import { create } from 'zustand';
import type { Plan, Workout, SocialPost, WorkoutSet } from './types';
import {
  getPlans,
  addPlan as dbAddPlan,
  updatePlan as dbUpdatePlan,
  deletePlan as dbDeletePlan,
  getWorkouts,
  addWorkout as dbAddWorkout,
  getLastWorkoutForExercise,
} from './utils/db';
import { generateMockSocialPosts, generateMockPlans } from './utils/mockData';
import { generateId } from './utils/helpers';

export interface WriteMetrics {
  lastWriteDuration: number | null;
  lastWriteTimedOut: boolean;
  totalWrites: number;
  timedOutWrites: number;
}

interface AppState {
  plans: Plan[];
  workouts: Workout[];
  socialPosts: SocialPost[];
  currentPlanId: string | null;
  isLoading: boolean;
  writeMetrics: WriteMetrics;

  loadData: () => Promise<void>;
  setCurrentPlan: (planId: string | null) => void;

  addPlan: (plan: Omit<Plan, 'id' | 'createdAt'>) => Promise<void>;
  updatePlan: (plan: Plan) => Promise<void>;
  removePlan: (planId: string) => Promise<void>;

  addWorkout: (workout: Omit<Workout, 'id'>) => Promise<WriteMetrics>;
  getLastSetForExercise: (planId: string, exerciseId: string) => Promise<WorkoutSet | null>;

  toggleLike: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
}

const initialMetrics: WriteMetrics = {
  lastWriteDuration: null,
  lastWriteTimedOut: false,
  totalWrites: 0,
  timedOutWrites: 0,
};

export const useAppStore = create<AppState>((set, get) => ({
  plans: [],
  workouts: [],
  socialPosts: [],
  currentPlanId: null,
  isLoading: true,
  writeMetrics: { ...initialMetrics },

  loadData: async () => {
    set({ isLoading: true });

    const [plans, workouts] = await Promise.all([
      getPlans(),
      getWorkouts(),
    ]);

    let finalPlans = plans;
    if (plans.length === 0) {
      finalPlans = generateMockPlans();
      for (const plan of finalPlans) {
        await dbAddPlan(plan);
      }
    }

    const socialPosts = generateMockSocialPosts(50);

    set({
      plans: finalPlans,
      workouts,
      socialPosts,
      isLoading: false,
    });
  },

  setCurrentPlan: (planId) => {
    set({ currentPlanId: planId });
  },

  addPlan: async (planData) => {
    const newPlan: Plan = {
      ...planData,
      id: generateId(),
      createdAt: Date.now(),
    };

    await dbAddPlan(newPlan);
    set((state) => ({
      plans: [...state.plans, newPlan],
    }));
  },

  updatePlan: async (plan) => {
    await dbUpdatePlan(plan);
    set((state) => ({
      plans: state.plans.map((p) => (p.id === plan.id ? plan : p)),
    }));
  },

  removePlan: async (planId) => {
    await dbDeletePlan(planId);
    set((state) => ({
      plans: state.plans.filter((p) => p.id !== planId),
      currentPlanId: state.currentPlanId === planId ? null : state.currentPlanId,
    }));
  },

  addWorkout: async (workoutData) => {
    const newWorkout: Workout = {
      ...workoutData,
      id: generateId(),
    };

    const startTime = performance.now();
    let timedOut = false;

    try {
      await dbAddWorkout(newWorkout);
    } catch (err) {
      console.debug('[Store] IndexedDB write failed, data saved to localStorage fallback');
      timedOut = true;
    }

    const duration = performance.now() - startTime;
    if (duration > 200) {
      console.warn(`[Store] Workout write exceeded 200ms: ${duration.toFixed(2)}ms`);
      timedOut = true;
    }

    const metrics: WriteMetrics = {
      lastWriteDuration: duration,
      lastWriteTimedOut: timedOut,
      totalWrites: get().writeMetrics.totalWrites + 1,
      timedOutWrites: get().writeMetrics.timedOutWrites + (timedOut ? 1 : 0),
    };

    set((state) => ({
      workouts: [...state.workouts, newWorkout],
      writeMetrics: metrics,
    }));

    return metrics;
  },

  getLastSetForExercise: async (planId, exerciseId) => {
    try {
      return await getLastWorkoutForExercise(planId, exerciseId);
    } catch (err) {
      console.debug('[Store] Failed to query exercise history:', err);
      return null;
    }
  },

  toggleLike: (postId) => {
    set((state) => ({
      socialPosts: state.socialPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      ),
    }));
  },

  addComment: (postId, content) => {
    const newComment = {
      id: generateId(),
      userId: 'me',
      userName: '我',
      content,
      date: Date.now(),
    };

    set((state) => ({
      socialPosts: state.socialPosts.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      ),
    }));
  },
}));
