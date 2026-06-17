import { v4 as uuidv4 } from 'uuid';
import type { AppState, Skill, Checkin, MatchResult, BuddyPair, WeeklyPlan, Toast, User } from '../types';
import { generateMockUsers, generateMockSkills } from '../modules/skillManager';

const STORAGE_KEY = 'skillbuddy_state_v1';

export const loadState = (): Partial<AppState> | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as Partial<AppState>;
    }
  } catch (e) {
    console.error('加载状态失败:', e);
  }
  return null;
};

export const saveState = (state: Partial<AppState>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('保存状态失败:', e);
  }
};

export const createInitialState = (): AppState => {
  const defaultState: AppState = {
    currentUser: { id: '', nickname: '' },
    users: [],
    skills: [],
    matches: [],
    buddies: [],
    checkins: [],
    plans: [],
    toasts: [],
  };

  const saved = loadState();
  if (saved && saved.currentUser && saved.users) {
    return { ...defaultState, ...saved, toasts: [] };
  }

  const mockUsers = generateMockUsers(20);
  const currentUser: User = {
    id: uuidv4(),
    nickname: '我自己',
  };
  const allUsers = [currentUser, ...mockUsers];
  const mockSkills = generateMockSkills(allUsers);

  return {
    currentUser,
    users: allUsers,
    skills: mockSkills,
    matches: [],
    buddies: [],
    checkins: [],
    plans: [],
    toasts: [],
  };
};
