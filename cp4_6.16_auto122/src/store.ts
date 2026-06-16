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

interface AppState {
  plans: Plan[];
  workouts: Workout[];
  socialPosts: SocialPost[];
  currentPlanId: string | null;
  isLoading: boolean;

  loadData: () => Promise<void>;
  setCurrentPlan: (planId: string | null) => void;

  addPlan: (plan: Omit<Plan, 'id' | 'createdAt'>) => Promise<void>;
  updatePlan: (plan: Plan) => Promise<void>;
  removePlan: (planId: string) => Promise<void>;

  addWorkout: (workout: Omit<Workout, 'id'>) => Promise<void>;
  getLastSetForExercise: (planId: string, exerciseId: string) => Promise<WorkoutSet | null>;

  toggleLike: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  plans: [],
  workouts: [],
  socialPosts: [],
  currentPlanId: null,
  isLoading: true,

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

    await dbAddWorkout(newWorkout);
    set((state) => ({
      workouts: [...state.workouts, newWorkout],
    }));
  },

  getLastSetForExercise: async (planId, exerciseId) => {
    return await getLastWorkoutForExercise(planId, exerciseId);
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
