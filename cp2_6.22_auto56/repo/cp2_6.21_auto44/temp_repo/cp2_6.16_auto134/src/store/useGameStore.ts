import { create } from 'zustand';
import { GameScene, ShipBuild, LeaderboardEntry, Achievement, WeaponType, ShieldType, EngineType, PartLevel } from '../types';

interface GameStore {
  scene: GameScene;
  score: number;
  wave: number;
  lives: number;
  highScore: number;
  credits: number;
  totalKills: number;
  currentBuild: ShipBuild | null;
  builds: ShipBuild[];
  leaderboard: LeaderboardEntry[];
  achievements: Achievement[];
  showAchievement: Achievement | null;
  
  setScene: (scene: GameScene) => void;
  setScore: (score: number) => void;
  setWave: (wave: number) => void;
  setLives: (lives: number) => void;
  setHighScore: (score: number) => void;
  setCredits: (credits: number) => void;
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  setTotalKills: (kills: number) => void;
  addKills: (count: number) => void;
  
  setCurrentBuild: (build: ShipBuild) => void;
  setBuilds: (builds: ShipBuild[]) => void;
  updateBuild: (build: ShipBuild) => void;
  
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  
  setAchievements: (achievements: Achievement[]) => void;
  unlockAchievement: (id: string) => Achievement | null;
  hideAchievementPopup: () => void;
}

const defaultBuild: ShipBuild = {
  id: 'default',
  name: '默认配置',
  weapon: { type: 'laser' as WeaponType, level: 1 as PartLevel },
  shield: { type: 'damage' as ShieldType, level: 1 as PartLevel },
  engine: { type: 'speed' as EngineType, level: 1 as PartLevel },
};

export const useGameStore = create<GameStore>((set, get) => ({
  scene: 'menu',
  score: 0,
  wave: 1,
  lives: 3,
  highScore: 0,
  credits: 0,
  totalKills: 0,
  currentBuild: defaultBuild,
  builds: [defaultBuild],
  leaderboard: [],
  achievements: [],
  showAchievement: null,

  setScene: (scene) => set({ scene }),
  setScore: (score) => set({ score }),
  setWave: (wave) => set({ wave }),
  setLives: (lives) => set({ lives }),
  setHighScore: (highScore) => set({ highScore }),
  setCredits: (credits) => set({ credits }),
  addCredits: (amount) => set((state) => ({ credits: state.credits + amount })),
  spendCredits: (amount) => {
    const state = get();
    if (state.credits >= amount) {
      set({ credits: state.credits - amount });
      return true;
    }
    return false;
  },
  setTotalKills: (totalKills) => set({ totalKills }),
  addKills: (count) => set((state) => ({ totalKills: state.totalKills + count })),

  setCurrentBuild: (currentBuild) => set({ currentBuild }),
  setBuilds: (builds) => set({ builds }),
  updateBuild: (build) => set((state) => {
    const builds = state.builds.map(b => b.id === build.id ? build : b);
    const currentBuild = state.currentBuild?.id === build.id ? build : state.currentBuild;
    return { builds, currentBuild };
  }),

  setLeaderboard: (leaderboard) => set({ leaderboard }),

  setAchievements: (achievements) => set({ achievements }),
  unlockAchievement: (id) => {
    const state = get();
    const achievement = state.achievements.find(a => a.id === id);
    if (achievement && !achievement.unlocked) {
      const unlocked = { ...achievement, unlocked: true, unlockedAt: Date.now() };
      const achievements = state.achievements.map(a => a.id === id ? unlocked : a);
      set({ achievements, showAchievement: unlocked });
      return unlocked;
    }
    return null;
  },
  hideAchievementPopup: () => set({ showAchievement: null }),
}));
