import { create } from 'zustand';
import type { Challenge, DifficultyFilter } from '@/types';
import challengesData from '@/data/challenges.json';

interface ChallengeState {
  challenges: Challenge[];
  currentChallenge: Challenge | null;
  filter: DifficultyFilter;
  setFilter: (filter: DifficultyFilter) => void;
  loadChallenges: () => void;
  getChallengeById: (id: string) => Challenge | undefined;
  setCurrentChallenge: (id: string) => void;
  getFilteredChallenges: () => Challenge[];
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  challenges: [],
  currentChallenge: null,
  filter: 'all',

  setFilter: (filter) => set({ filter }),

  loadChallenges: () => {
    set({ challenges: challengesData as Challenge[] });
  },

  getChallengeById: (id) => {
    return get().challenges.find((c) => c.id === id);
  },

  setCurrentChallenge: (id) => {
    const challenge = get().challenges.find((c) => c.id === id) || null;
    set({ currentChallenge: challenge });
  },

  getFilteredChallenges: () => {
    const { challenges, filter } = get();
    if (filter === 'all') return challenges;
    return challenges.filter((c) => c.difficulty === filter);
  },
}));
