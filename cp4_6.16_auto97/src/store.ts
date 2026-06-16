import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { Challenge, Submission, UserStats, Achievement, Language, TestResult } from '@/types';
import { challenges } from '@/data/challenges';
import { runCode, runTests } from '@/utils/sandbox';

interface AppState {
  challenges: Challenge[];
  currentChallenge: Challenge | null;
  submissions: Submission[];
  userStats: UserStats;
  achievements: Achievement[];
  searchQuery: string;
  difficultyFilter: 'all' | 'easy' | 'medium' | 'hard';
  isRunning: boolean;
  isSubmitting: boolean;
  runOutput: string;
  runError: string | null;
  testResults: TestResult[];
  testStatus: ('pending' | 'running' | 'passed' | 'failed')[];
  newlyUnlockedAchievement: Achievement | null;
  showAchievementAnimation: boolean;

  setCurrentChallenge: (challenge: Challenge | null) => void;
  setSearchQuery: (query: string) => void;
  setDifficultyFilter: (filter: 'all' | 'easy' | 'medium' | 'hard') => void;
  executeCode: (code: string, language: Language) => Promise<void>;
  submitCode: (code: string, language: Language, challenge: Challenge) => Promise<void>;
  dismissAchievementAnimation: () => void;
  loadPersistedData: () => Promise<void>;
}

const defaultAchievements: Achievement[] = [
  { id: 'first-solve', name: '初出茅庐', description: '完成1道题目', icon: '🌱', unlocked: false, unlockedAt: null },
  { id: 'getting-better', name: '渐入佳境', description: '完成3道题目', icon: '🌿', unlocked: false, unlockedAt: null },
  { id: 'master-solver', name: '解题达人', description: '完成5道题目', icon: '🌳', unlocked: false, unlockedAt: null },
  { id: 'easy-complete', name: '全通简单', description: '通过所有简单题', icon: '⭐', unlocked: false, unlockedAt: null },
  { id: 'medium-breakthrough', name: '中等突破', description: '通过所有中等题', icon: '🔥', unlocked: false, unlockedAt: null },
  { id: 'ultimate-challenge', name: '终极挑战', description: '通过所有困难题', icon: '👑', unlocked: false, unlockedAt: null },
];

const defaultStats: UserStats = {
  totalSolved: 0,
  totalSubmissions: 0,
  passRate: 0,
  dailyRecords: [],
  solvedChallengeIds: [],
};

function checkAchievements(stats: UserStats, challenges: Challenge[], currentAchievements: Achievement[]): Achievement[] {
  const updated = currentAchievements.map(a => ({ ...a }));
  const solvedIds = stats.solvedChallengeIds;
  const easyIds = challenges.filter(c => c.difficulty === 'easy').map(c => c.id);
  const mediumIds = challenges.filter(c => c.difficulty === 'medium').map(c => c.id);
  const hardIds = challenges.filter(c => c.difficulty === 'hard').map(c => c.id);

  const unlock = (id: string) => {
    const ach = updated.find(a => a.id === id);
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      ach.unlockedAt = Date.now();
    }
  };

  if (solvedIds.length >= 1) unlock('first-solve');
  if (solvedIds.length >= 3) unlock('getting-better');
  if (solvedIds.length >= 5) unlock('master-solver');
  if (easyIds.every(id => solvedIds.includes(id))) unlock('easy-complete');
  if (mediumIds.every(id => solvedIds.includes(id))) unlock('medium-breakthrough');
  if (hardIds.every(id => solvedIds.includes(id))) unlock('ultimate-challenge');

  return updated;
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDailyRecord(records: { date: string; count: number }[]): { date: string; count: number }[] {
  const today = getTodayStr();
  const updated = [...records];
  const existing = updated.find(r => r.date === today);
  if (existing) {
    existing.count++;
  } else {
    updated.push({ date: today, count: 1 });
  }
  return updated.slice(-30);
}

export const useStore = create<AppState>((set, get) => ({
  challenges,
  currentChallenge: null,
  submissions: [],
  userStats: defaultStats,
  achievements: defaultAchievements,
  searchQuery: '',
  difficultyFilter: 'all',
  isRunning: false,
  isSubmitting: false,
  runOutput: '',
  runError: null,
  testResults: [],
  testStatus: [],
  newlyUnlockedAchievement: null,
  showAchievementAnimation: false,

  setCurrentChallenge: (challenge) => {
    set({
      currentChallenge: challenge,
      runOutput: '',
      runError: null,
      testResults: [],
      testStatus: [],
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setDifficultyFilter: (filter) => set({ difficultyFilter: filter }),

  executeCode: async (code, language) => {
    set({ isRunning: true, runOutput: '', runError: null });
    try {
      const result = await runCode(code, language);
      set({
        isRunning: false,
        runOutput: result.output,
        runError: result.error,
      });
    } catch (e) {
      set({
        isRunning: false,
        runOutput: '',
        runError: (e as Error).message,
      });
    }
  },

  submitCode: async (code, language, challenge) => {
    set({
      isSubmitting: true,
      testResults: [],
      testStatus: challenge.testCases.slice(0, 5).map(() => 'pending'),
    });

    const sampledTestCases = challenge.testCases
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    const allPending: ('pending' | 'running' | 'passed' | 'failed')[] = sampledTestCases.map(() => 'pending');
    set({ testStatus: [...allPending] });

    try {
      for (let i = 0; i < sampledTestCases.length; i++) {
        const newStatus = [...get().testStatus];
        newStatus[i] = 'running';
        set({ testStatus: newStatus });

        const result = await runTests(
          code,
          challenge.functionName,
          [sampledTestCases[i]],
          language
        );

        const updatedStatus = [...get().testStatus];
        updatedStatus[i] = result.results[0].passed ? 'passed' : 'failed';
        set({ testStatus: updatedStatus });

        await new Promise(r => setTimeout(r, 300));
      }

      const finalStatus = get().testStatus;
      const allPassed = finalStatus.every(s => s === 'passed');

      const submission: Submission = {
        id: uuidv4(),
        challengeId: challenge.id,
        code,
        language,
        passed: allPassed,
        timestamp: Date.now(),
        results: [],
      };

      const currentStats = { ...get().userStats };
      const prevSolvedIds = [...currentStats.solvedChallengeIds];
      const newSolved = allPassed && !prevSolvedIds.includes(challenge.id);

      if (newSolved) {
        currentStats.solvedChallengeIds = [...prevSolvedIds, challenge.id];
        currentStats.totalSolved = currentStats.solvedChallengeIds.length;
      }
      currentStats.totalSubmissions++;
      currentStats.passRate = currentStats.totalSubmissions > 0
        ? Math.round((currentStats.totalSolved / currentStats.totalSubmissions) * 100) / 100
        : 0;
      currentStats.dailyRecords = addDailyRecord(currentStats.dailyRecords);

      const updatedAchievements = checkAchievements(currentStats, challenges, get().achievements);
      const newlyUnlocked = updatedAchievements.find(
        (a, i) => a.unlocked && !get().achievements[i].unlocked
      );

      const newSubmissions = [...get().submissions, submission];

      set({
        isSubmitting: false,
        submissions: newSubmissions,
        userStats: currentStats,
        achievements: updatedAchievements,
      });

      if (newlyUnlocked) {
        set({
          newlyUnlockedAchievement: newlyUnlocked,
          showAchievementAnimation: true,
        });
      }

      await idbSet('codequest_stats', currentStats);
      await idbSet('codequest_submissions', newSubmissions);
      await idbSet('codequest_achievements', updatedAchievements);
    } catch (e) {
      set({ isSubmitting: false });
    }
  },

  dismissAchievementAnimation: () => {
    set({
      showAchievementAnimation: false,
      newlyUnlockedAchievement: null,
    });
  },

  loadPersistedData: async () => {
    try {
      const [savedStats, savedSubmissions, savedAchievements] = await Promise.all([
        idbGet('codequest_stats'),
        idbGet('codequest_submissions'),
        idbGet('codequest_achievements'),
      ]);

      if (savedStats) set({ userStats: savedStats as UserStats });
      if (savedSubmissions) set({ submissions: savedSubmissions as Submission[] });
      if (savedAchievements) set({ achievements: savedAchievements as Achievement[] });
    } catch {
      // ignore
    }
  },
}));
