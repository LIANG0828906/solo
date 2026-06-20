import { create } from 'zustand';
import type {
  CreatureType,
  EvolutionStage,
  CreatureStats,
  EnvironmentParams,
  ToastMessage,
} from '../types';
import {
  calculateSuccessRate,
  generateCreatureStats,
  calculateLevelProgress,
} from '../utils/calculations';
import {
  EGG_CONFIGS,
  INCUBATION_DURATION,
  EVOLUTION_REQUIREMENTS,
} from '../utils/constants';

interface IncubationStore {
  selectedEgg: CreatureType | null;
  environment: EnvironmentParams;
  successRate: number;
  incubationProgress: number;
  isIncubating: boolean;
  remainingTime: number;
  evolutionStage: EvolutionStage;
  creatureStats: CreatureStats | null;
  level: number;
  experience: number;
  levelProgress: number;
  feedingCount: number;
  trainingCount: number;
  canEvolve: boolean;
  isEvolving: boolean;
  toasts: ToastMessage[];

  selectEgg: (type: CreatureType) => void;
  setEnvironment: (params: Partial<EnvironmentParams>) => void;
  startIncubation: () => void;
  updateProgress: (deltaTime: number) => void;
  completeIncubation: () => void;
  feedCreature: () => void;
  trainCreature: () => void;
  evolve: () => void;
  finishEvolving: () => void;
  reset: () => void;
  addToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  hideToast: (id: string) => void;
  checkEvolutionEligibility: () => void;
}

const initialEnvironment: EnvironmentParams = {
  temperature: 20,
  humidity: 50,
  aura: 100,
};

export const useIncubationStore = create<IncubationStore>((set, get) => ({
  selectedEgg: null,
  environment: initialEnvironment,
  successRate: 0,
  incubationProgress: 0,
  isIncubating: false,
  remainingTime: INCUBATION_DURATION,
  evolutionStage: 'egg',
  creatureStats: null,
  level: 1,
  experience: 0,
  levelProgress: 0,
  feedingCount: 0,
  trainingCount: 0,
  canEvolve: false,
  isEvolving: false,
  toasts: [],

  selectEgg: (type: CreatureType) => {
    set({ selectedEgg: type });
    const state = get();
    const newRate = calculateSuccessRate(type, state.environment);
    set({ successRate: newRate });
  },

  setEnvironment: (params: Partial<EnvironmentParams>) => {
    set((state) => ({
      environment: { ...state.environment, ...params },
    }));
    const state = get();
    if (state.selectedEgg) {
      const newRate = calculateSuccessRate(state.selectedEgg, state.environment);
      set({ successRate: newRate });
    }
  },

  startIncubation: () => {
    const state = get();
    if (!state.selectedEgg || state.isIncubating) return;
    set({ isIncubating: true, incubationProgress: 0, remainingTime: INCUBATION_DURATION });
  },

  updateProgress: (deltaTime: number) => {
    const state = get();
    if (!state.isIncubating) return;

    const deltaProgress = (deltaTime / INCUBATION_DURATION) * 100;
    const newProgress = Math.min(100, state.incubationProgress + deltaProgress);
    const newRemainingTime = Math.max(0, state.remainingTime - deltaTime);

    set({
      incubationProgress: newProgress,
      remainingTime: newRemainingTime,
    });

    if (newProgress >= 100) {
      get().completeIncubation();
    }
  },

  completeIncubation: () => {
    const state = get();
    if (!state.selectedEgg) return;

    const stats = generateCreatureStats(state.selectedEgg, state.successRate);
    set({
      isIncubating: false,
      evolutionStage: 'baby',
      creatureStats: stats,
      level: 1,
      experience: 0,
      levelProgress: 0,
      feedingCount: 0,
      trainingCount: 0,
    });

    const eggName = EGG_CONFIGS[state.selectedEgg]?.name || '灵兽';
    get().addToast(`🎉 ${eggName}孵化成功！`, 'success');
  },

  feedCreature: () => {
    const state = get();
    if (state.evolutionStage === 'egg' || state.isEvolving) return;

    const expGain = 25 + Math.floor(Math.random() * 15);
    const newExp = state.experience + expGain;
    const progress = calculateLevelProgress(state.level, newExp);

    set({
      experience: progress.experience,
      level: progress.level,
      levelProgress: progress.progress,
      feedingCount: state.feedingCount + 1,
    });

    get().checkEvolutionEligibility();
    get().addToast(`喂食灵果，获得 ${expGain} 经验`, 'info');
  },

  trainCreature: () => {
    const state = get();
    if (state.evolutionStage === 'egg' || state.isEvolving) return;

    const expGain = 40 + Math.floor(Math.random() * 20);
    const newExp = state.experience + expGain;
    const progress = calculateLevelProgress(state.level, newExp);

    set({
      experience: progress.experience,
      level: progress.level,
      levelProgress: progress.progress,
      trainingCount: state.trainingCount + 1,
    });

    get().checkEvolutionEligibility();
    get().addToast(`战斗训练完成，获得 ${expGain} 经验`, 'info');
  },

  checkEvolutionEligibility: () => {
    const state = get();
    let canEvolve = false;

    if (state.evolutionStage === 'baby') {
      canEvolve =
        state.level >= EVOLUTION_REQUIREMENTS.baby_to_adult.level &&
        state.trainingCount >= EVOLUTION_REQUIREMENTS.baby_to_adult.trainingCount;
    } else if (state.evolutionStage === 'adult') {
      canEvolve =
        state.level >= EVOLUTION_REQUIREMENTS.adult_to_evolved.level &&
        state.trainingCount >= EVOLUTION_REQUIREMENTS.adult_to_evolved.trainingCount;
    }

    set({ canEvolve });
  },

  evolve: () => {
    const state = get();
    if (!state.canEvolve || state.isEvolving) return;

    set({ isEvolving: true, canEvolve: false });
  },

  finishEvolving: () => {
    const state = get();
    let newStage: EvolutionStage = state.evolutionStage;

    if (state.evolutionStage === 'baby') {
      newStage = 'adult';
    } else if (state.evolutionStage === 'adult') {
      newStage = 'evolved';
    }

    if (state.creatureStats) {
      const boostedStats: CreatureStats = {
        health: Math.min(100, state.creatureStats.health + 15),
        attack: Math.min(100, state.creatureStats.attack + 15),
        defense: Math.min(100, state.creatureStats.defense + 15),
        speed: Math.min(100, state.creatureStats.speed + 15),
        spirit: Math.min(100, state.creatureStats.spirit + 15),
        potential: Math.min(100, state.creatureStats.potential + 10),
      };
      set({ creatureStats: boostedStats });
    }

    set({
      evolutionStage: newStage,
      isEvolving: false,
    });

    get().addToast(`✨ 进化成功！进入${newStage === 'adult' ? '成体' : '进化体'}阶段`, 'success');
  },

  reset: () => {
    set({
      selectedEgg: null,
      environment: initialEnvironment,
      successRate: 0,
      incubationProgress: 0,
      isIncubating: false,
      remainingTime: INCUBATION_DURATION,
      evolutionStage: 'egg',
      creatureStats: null,
      level: 1,
      experience: 0,
      levelProgress: 0,
      feedingCount: 0,
      trainingCount: 0,
      canEvolve: false,
      isEvolving: false,
    });
  },

  addToast: (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, visible: true }],
    }));

    setTimeout(() => {
      get().hideToast(id);
    }, 5000);
  },

  hideToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
