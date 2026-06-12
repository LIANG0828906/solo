import { create } from 'zustand';
import { IPetData, AnimationState, BattleResult, IBattleState, ATTRIBUTE_THRESHOLDS } from '../types/pet';
import { getRandomOpponent } from '../mock/opponentData';

const DECAY_INTERVAL = 30000;
const HUNGER_DECAY = 2;
const MOOD_DECAY = 1;
const ENERGY_DECAY = 1;

interface PetStoreState {
  pet: IPetData;
  battle: IBattleState;
  isWarning: boolean;
  actionAnimationTimer: number | null;
  startDecayLoop: () => void;
  stopDecayLoop: () => void;
  setAnimation: (animation: AnimationState, duration?: number) => void;
  feed: () => void;
  clean: () => void;
  play: () => void;
  train: () => void;
  startBattle: () => void;
  endBattle: () => void;
  calculateBattleResult: () => BattleResult;
  applyBattleResult: (result: BattleResult) => void;
  triggerLevelUp: () => void;
  hideLevelUp: () => void;
  clampAttributes: () => void;
  checkWarning: () => void;
}

const createInitialPet = (): IPetData => ({
  id: 'pet-001',
  name: '小绿龙',
  type: 'dragon',
  hunger: 80,
  mood: 85,
  energy: 90,
  intelligence: 50,
  level: 1,
  exp: 0,
  expToNextLevel: 300,
  currentAnimation: 'idle',
  lastActionTime: Date.now(),
});

const createInitialBattleState = (): IBattleState => ({
  isActive: false,
  opponent: null,
  result: null,
  showingResult: false,
  showLevelUp: false,
  levelUpTimer: 0,
});

export const usePetStore = create<PetStoreState>((set, get) => {
  let decayTimer: number | null = null;
  let animationTimer: number | null = null;

  const clamp = (value: number): number =>
    Math.max(ATTRIBUTE_THRESHOLDS.min, Math.min(ATTRIBUTE_THRESHOLDS.max, value));

  const calculateBattleScore = (data: {
    intelligence: number;
    energy: number;
    mood: number;
    hunger: number;
  }): number => {
    return (
      data.intelligence * 0.4 +
      data.energy * 0.3 +
      data.mood * 0.2 +
      data.hunger * 0.1
    );
  };

  return {
    pet: createInitialPet(),
    battle: createInitialBattleState(),
    isWarning: false,
    actionAnimationTimer: null,

    startDecayLoop: () => {
      if (decayTimer !== null) {
        clearInterval(decayTimer);
      }
      decayTimer = window.setInterval(() => {
        const state = get();
        if (state.battle.isActive) return;

        set((state) => {
          const newHunger = clamp(state.pet.hunger - HUNGER_DECAY);
          const newMood = clamp(state.pet.mood - MOOD_DECAY);
          const newEnergy = clamp(state.pet.energy - ENERGY_DECAY);

          const isWarning =
            newHunger < ATTRIBUTE_THRESHOLDS.warning ||
            newMood < ATTRIBUTE_THRESHOLDS.warning ||
            newEnergy < ATTRIBUTE_THRESHOLDS.warning;

          return {
            pet: {
              ...state.pet,
              hunger: newHunger,
              mood: newMood,
              energy: newEnergy,
            },
            isWarning,
          };
        });
      }, DECAY_INTERVAL);
    },

    stopDecayLoop: () => {
      if (decayTimer !== null) {
        clearInterval(decayTimer);
        decayTimer = null;
      }
    },

    setAnimation: (animation: AnimationState, duration: number = 1500) => {
      if (animationTimer !== null) {
        clearTimeout(animationTimer);
      }

      set((state) => ({
        pet: {
          ...state.pet,
          currentAnimation: animation,
          lastActionTime: Date.now(),
        },
      }));

      animationTimer = window.setTimeout(() => {
        set((state) => ({
          pet: {
            ...state.pet,
            currentAnimation: 'idle',
          },
        }));
        animationTimer = null;
      }, duration);
    },

    feed: () => {
      const state = get();
      if (state.battle.isActive) return;

      set((state) => ({
        pet: {
          ...state.pet,
          hunger: clamp(state.pet.hunger + 15),
          mood: clamp(state.pet.mood + 3),
          energy: clamp(state.pet.energy + 2),
        },
      }));

      get().setAnimation('eat', 1800);
      get().checkWarning();
    },

    clean: () => {
      const state = get();
      if (state.battle.isActive) return;

      set((state) => ({
        pet: {
          ...state.pet,
          mood: clamp(state.pet.mood + 10),
          energy: clamp(state.pet.energy - 3),
        },
      }));

      get().setAnimation('walk', 1200);
      get().checkWarning();
    },

    play: () => {
      const state = get();
      if (state.battle.isActive) return;

      set((state) => ({
        pet: {
          ...state.pet,
          mood: clamp(state.pet.mood + 18),
          energy: clamp(state.pet.energy - 10),
          hunger: clamp(state.pet.hunger - 5),
          exp: state.pet.exp + 20,
        },
      }));

      get().setAnimation('walk', 2000);
      get().checkWarning();
      get().clampAttributes();

      setTimeout(() => {
        const currentState = get();
        if (currentState.pet.exp >= currentState.pet.expToNextLevel) {
          get().triggerLevelUp();
        }
      }, 100);
    },

    train: () => {
      const state = get();
      if (state.battle.isActive) return;

      set((state) => ({
        pet: {
          ...state.pet,
          intelligence: clamp(state.pet.intelligence + 12),
          energy: clamp(state.pet.energy - 15),
          hunger: clamp(state.pet.hunger - 8),
          mood: clamp(state.pet.mood - 5),
          exp: state.pet.exp + 35,
        },
      }));

      get().setAnimation('eat', 2000);
      get().checkWarning();
      get().clampAttributes();

      setTimeout(() => {
        const currentState = get();
        if (currentState.pet.exp >= currentState.pet.expToNextLevel) {
          get().triggerLevelUp();
        }
      }, 100);
    },

    startBattle: () => {
      const state = get();
      if (state.battle.isActive) return;

      const opponent = getRandomOpponent(state.pet.id);

      set((state) => ({
        battle: {
          ...state.battle,
          isActive: true,
          opponent,
          result: null,
          showingResult: false,
        },
        pet: {
          ...state.pet,
          currentAnimation: 'idle',
          lastActionTime: Date.now(),
        },
      }));

      setTimeout(() => {
        const result = get().calculateBattleResult();
        set((state) => ({
          battle: {
            ...state.battle,
            result,
            showingResult: true,
          },
        }));

        setTimeout(() => {
          get().applyBattleResult(result);
        }, 1500);
      }, 2500);
    },

    endBattle: () => {
      set(() => ({
        battle: createInitialBattleState(),
      }));
    },

    calculateBattleResult: (): BattleResult => {
      const state = get();
      if (!state.battle.opponent) return 'draw';

      const petScore = calculateBattleScore({
        intelligence: state.pet.intelligence,
        energy: state.pet.energy,
        mood: state.pet.mood,
        hunger: state.pet.hunger,
      });

      const opponentScore = calculateBattleScore({
        intelligence: state.battle.opponent.intelligence,
        energy: state.battle.opponent.energy,
        mood: state.battle.opponent.mood,
        hunger: state.battle.opponent.hunger,
      });

      const levelBonus = state.pet.level * 2;
      const adjustedPetScore = petScore + levelBonus;

      if (adjustedPetScore > opponentScore) return 'win';
      if (adjustedPetScore < opponentScore) return 'lose';
      return 'draw';
    },

    applyBattleResult: (result: BattleResult) => {
      set((state) => {
        let newExp = state.pet.exp;
        let newMood = state.pet.mood;
        let newEnergy = state.pet.energy;
        let newLevel = state.pet.level;
        let newExpToNext = state.pet.expToNextLevel;
        let showLevelUp = false;

        switch (result) {
          case 'win':
            newExp += 100;
            newMood = clamp(newMood + 15);
            newEnergy = clamp(newEnergy - 20);

            while (newExp >= newExpToNext) {
              newExp -= newExpToNext;
              newLevel += 1;
              newExpToNext = Math.floor(newExpToNext * 1.5);
              showLevelUp = true;
            }
            break;

          case 'lose':
            newMood = clamp(newMood - 10);
            newEnergy = clamp(newEnergy + 5);
            newExp += 30;
            break;

          case 'draw':
            newExp += 50;
            newMood = clamp(newMood + 5);
            newEnergy = clamp(newEnergy - 10);
            break;
        }

        return {
          pet: {
            ...state.pet,
            mood: newMood,
            energy: newEnergy,
            exp: newExp,
            level: newLevel,
            expToNextLevel: newExpToNext,
          },
          battle: {
            ...state.battle,
            showLevelUp,
            levelUpTimer: showLevelUp ? 1500 : 0,
          },
        };
      });

      get().checkWarning();
    },

    triggerLevelUp: () => {
      set((state) => {
        const newLevel = state.pet.level + 1;
        const remainingExp = state.pet.exp - state.pet.expToNextLevel;
        const newExpToNext = Math.floor(state.pet.expToNextLevel * 1.5);

        return {
          pet: {
            ...state.pet,
            level: newLevel,
            exp: Math.max(0, remainingExp),
            expToNextLevel: newExpToNext,
            hunger: clamp(state.pet.hunger + 10),
            mood: clamp(state.pet.mood + 10),
            energy: clamp(state.pet.energy + 10),
            intelligence: clamp(state.pet.intelligence + 5),
          },
          battle: {
            ...state.battle,
            showLevelUp: true,
            levelUpTimer: 1500,
          },
        };
      });

      setTimeout(() => {
        get().hideLevelUp();
      }, 1500);
    },

    hideLevelUp: () => {
      set((state) => ({
        battle: {
          ...state.battle,
          showLevelUp: false,
          levelUpTimer: 0,
        },
      }));
    },

    clampAttributes: () => {
      set((state) => ({
        pet: {
          ...state.pet,
          hunger: clamp(state.pet.hunger),
          mood: clamp(state.pet.mood),
          energy: clamp(state.pet.energy),
          intelligence: clamp(state.pet.intelligence),
        },
      }));
    },

    checkWarning: () => {
      const state = get();
      const isWarning =
        state.pet.hunger < ATTRIBUTE_THRESHOLDS.warning ||
        state.pet.mood < ATTRIBUTE_THRESHOLDS.warning ||
        state.pet.energy < ATTRIBUTE_THRESHOLDS.warning;

      set({ isWarning });
    },
  };
});
