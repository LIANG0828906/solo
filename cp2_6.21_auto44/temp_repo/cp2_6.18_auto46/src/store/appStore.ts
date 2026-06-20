import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, Skill, Checkin, MatchResult, BuddyPair, WeeklyPlan, Toast, User, ProficiencyLevel, TimeSlot } from '../types';
import { createInitialState, saveState } from '../utils/storage';
import { findMatchingBuddies, createSkill as createSkillFn } from '../modules/skillManager';
import { createCheckin as createCheckinFn, calculateStreak } from '../modules/progressTracker';

interface AppActions {
  addSkill: (name: string, level: ProficiencyLevel, timeSlots: TimeSlot[]) => Skill;
  removeSkill: (skillId: string) => void;
  computeMatches: (skillId: string) => MatchResult[];
  sendInvite: (matchResult: MatchResult) => void;
  acceptInvite: (buddyId: string, skillId: string) => void;
  addCheckin: (skillId: string, date: string, duration: number, notes: string) => void;
  addPlan: (skillId: string, skillName: string, dailyTargets: Record<string, number>) => void;
  showToast: (message: string, type?: Toast['type']) => void;
  dismissToast: (toastId: string) => void;
  clearMatches: () => void;
}

export type AppStore = AppState & AppActions;

const persistMiddleware = (config: any) => (set: any, get: any, api: any) =>
  config(
    (args: any) => {
      set(args);
      const state = get();
      saveState({
        currentUser: state.currentUser,
        users: state.users,
        skills: state.skills,
        matches: state.matches,
        buddies: state.buddies,
        checkins: state.checkins,
        plans: state.plans,
      });
    },
    get,
    api
  );

export const useAppStore = create<AppStore>(
  persistMiddleware((set: any, get: any) => ({
    ...createInitialState(),

    addSkill: (name: string, level: ProficiencyLevel, timeSlots: TimeSlot[]) => {
      const state = get();
      const newSkill = createSkillFn(state.currentUser.id, name, level, timeSlots);
      set({ skills: [...state.skills, newSkill] });
      return newSkill;
    },

    removeSkill: (skillId: string) => {
      const state = get();
      set({
        skills: state.skills.filter((s: Skill) => s.id !== skillId),
        matches: state.matches.filter((m: MatchResult) => m.skill.id !== skillId),
      });
    },

    computeMatches: (skillId: string) => {
      const state = get();
      const userSkill = state.skills.find((s: Skill) => s.id === skillId);
      if (!userSkill) return [];

      const rawMatches = findMatchingBuddies(
        state.currentUser.id,
        userSkill,
        state.skills,
        state.users
      );

      const existingBuddyIds = new Set(
        state.buddies.map((b: BuddyPair) =>
          b.userId === state.currentUser.id ? b.buddyId : b.userId
        )
      );

      const filtered = rawMatches.filter(
        (m: any) => !existingBuddyIds.has(m.userId)
      );

      const matches: MatchResult[] = filtered.map(m => ({
        ...m,
        status: 'pending',
      }));

      set({ matches });
      return matches;
    },

    sendInvite: (matchResult: MatchResult) => {
      const state = get();
      const newBuddy: BuddyPair = {
        id: uuidv4(),
        userId: state.currentUser.id,
        buddyId: matchResult.userId,
        skillId: matchResult.skill.id,
        createdAt: Date.now(),
      };
      set({
        buddies: [...state.buddies, newBuddy],
        matches: state.matches.map((m: MatchResult) =>
          m.userId === matchResult.userId ? { ...m, status: 'accepted' } : m
        ),
      });
      get().showToast(`已成功向 ${matchResult.user.nickname} 发送学习邀请！`, 'success');
    },

    acceptInvite: (buddyId: string, skillId: string) => {
      const state = get();
      const exists = state.buddies.some(
        (b: BuddyPair) =>
          (b.userId === state.currentUser.id && b.buddyId === buddyId) ||
          (b.buddyId === state.currentUser.id && b.userId === buddyId)
      );
      if (!exists) {
        const newBuddy: BuddyPair = {
          id: uuidv4(),
          userId: state.currentUser.id,
          buddyId,
          skillId,
          createdAt: Date.now(),
        };
        set({ buddies: [...state.buddies, newBuddy] });
      }
      get().showToast('已成为学习伙伴！', 'success');
    },

    addCheckin: (skillId: string, date: string, duration: number, notes: string) => {
      const state = get();
      const newCheckin = createCheckinFn(state.currentUser.id, skillId, date, duration, notes);
      set({ checkins: [...state.checkins, newCheckin] });
      get().showToast(`打卡成功！学习 ${duration} 分钟`, 'success');
    },

    addPlan: (skillId: string, skillName: string, dailyTargets: Record<string, number>) => {
      const state = get();
      const newPlan: WeeklyPlan = {
        id: uuidv4(),
        skillId,
        skillName,
        dailyTargets,
        createdAt: Date.now(),
      };
      const existingPlanIndex = state.plans.findIndex((p: WeeklyPlan) => p.skillId === skillId);
      let newPlans;
      if (existingPlanIndex >= 0) {
        newPlans = [...state.plans];
        newPlans[existingPlanIndex] = newPlan;
      } else {
        newPlans = [...state.plans, newPlan];
      }
      set({ plans: newPlans });
      get().showToast('学习计划已保存', 'success');
    },

    showToast: (message: string, type: Toast['type'] = 'info') => {
      const state = get();
      const toast: Toast = {
        id: uuidv4(),
        message,
        type,
      };
      set({ toasts: [...state.toasts, toast] });
      setTimeout(() => {
        get().dismissToast(toast.id);
      }, 3000);
    },

    dismissToast: (toastId: string) => {
      const state = get();
      set({ toasts: state.toasts.filter((t: Toast) => t.id !== toastId) });
    },

    clearMatches: () => {
      set({ matches: [] });
    },
  }))
);
