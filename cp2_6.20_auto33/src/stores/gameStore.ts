import { create } from 'zustand';
import type {
  Pet, FloatingText, FurnitureType, FoodType, GiftType, CreatePetData
} from '../types';
import { LEVEL_EXP_TABLE } from '../types';
import { petApi, socialApi } from '../api';
import { uid, clamp } from '../utils/helpers';

interface FoodEffect {
  hunger: number;
  happiness: number;
  exp: number;
}

const FOOD_EFFECTS: Record<FoodType, FoodEffect> = {
  dry: { hunger: 25, happiness: 5, exp: 5 },
  can: { hunger: 40, happiness: 15, exp: 10 },
  snack: { hunger: 10, happiness: 25, exp: 8 },
};

const PLAY_EFFECT = { happiness: 20, energy: -15, exp: 12 };
const CLEAN_EFFECT = { cleanliness: 30, exp: 6 };
const REST_EFFECT = { energy: 40 };

function checkLevelUp(currentLevel: number, currentExp: number, newExp: number): { leveledUp: boolean; newLevel: number; finalExp: number } {
  let level = currentLevel;
  let exp = newExp;
  const maxLevel = LEVEL_EXP_TABLE.length - 1;

  while (level < maxLevel && exp >= LEVEL_EXP_TABLE[level + 1]) {
    level++;
  }

  return {
    leveledUp: level > currentLevel,
    newLevel: level,
    finalExp: exp
  };
}

interface GameState {
  userId: string | null;
  nickname: string;
  currentPet: Pet | null;
  floatingTexts: FloatingText[];
  showLevelUp: boolean;
  activeFurniture: FurnitureType | null;
  prevLevel: number;

  registerUser: (nickname: string) => void;
  createPet: (data: CreatePetData) => Promise<void>;
  feedPet: (foodType: FoodType) => Promise<boolean>;
  playPet: () => Promise<boolean>;
  cleanPet: () => Promise<boolean>;
  restPet: () => Promise<boolean>;
  sendGift: (toPetId: string, giftType: GiftType) => Promise<{
    ok: boolean;
    expGain?: number;
    happyGain?: number;
    msg?: string;
  }>;
  addFloatingText: (text: string, color: string, x?: number, y?: number, offsetX?: number, offsetY?: number, duration?: number) => void;
  removeFloatingText: (id: string) => void;
  dismissLevelUp: () => void;
  setActiveFurniture: (f: FurnitureType | null) => void;
  decayTick: () => void;
  restorePet: (pet: Pet) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  userId: null,
  nickname: '',
  currentPet: null,
  floatingTexts: [],
  showLevelUp: false,
  activeFurniture: null,
  prevLevel: 1,

  registerUser: (nickname) => {
    const existing = localStorage.getItem('pet_user_id');
    const userId = existing || uid();
    if (!existing) localStorage.setItem('pet_user_id', userId);
    set({ userId, nickname });
    localStorage.setItem('pet_nickname', nickname);
  },

  createPet: async (data) => {
    const pet = await petApi.createPet(data);
    localStorage.setItem('pet_id', pet.id);
    set({ currentPet: pet, prevLevel: pet.level });
  },

  restorePet: (pet) => {
    set({ currentPet: pet, prevLevel: pet.level });
  },

  feedPet: async (foodType) => {
    const pet = get().currentPet;
    if (!pet) return false;

    const effect = FOOD_EFFECTS[foodType];
    const newExp = pet.exp + effect.exp;
    const levelResult = checkLevelUp(pet.level, pet.exp, newExp);

    set({
      currentPet: {
        ...pet,
        hunger: clamp(pet.hunger + effect.hunger),
        happiness: clamp(pet.happiness + effect.happiness),
        exp: levelResult.finalExp,
        level: levelResult.newLevel,
      },
      prevLevel: pet.level,
    });

    if (levelResult.leveledUp) {
      set({ showLevelUp: true });
    }

    try {
      await petApi.feedPet(pet.id, foodType);
    } catch (e) {
      console.warn('feedPet API failed, state already updated locally');
    }

    return levelResult.leveledUp;
  },

  playPet: async () => {
    const pet = get().currentPet;
    if (!pet) return false;

    const newExp = pet.exp + PLAY_EFFECT.exp;
    const levelResult = checkLevelUp(pet.level, pet.exp, newExp);

    set({
      currentPet: {
        ...pet,
        happiness: clamp(pet.happiness + PLAY_EFFECT.happiness),
        energy: clamp(pet.energy + PLAY_EFFECT.energy),
        exp: levelResult.finalExp,
        level: levelResult.newLevel,
      },
      prevLevel: pet.level,
    });

    if (levelResult.leveledUp) {
      set({ showLevelUp: true });
    }

    try {
      await petApi.playPet(pet.id);
    } catch (e) {
      console.warn('playPet API failed, state already updated locally');
    }

    return levelResult.leveledUp;
  },

  cleanPet: async () => {
    const pet = get().currentPet;
    if (!pet) return false;

    const newExp = pet.exp + CLEAN_EFFECT.exp;
    const levelResult = checkLevelUp(pet.level, pet.exp, newExp);

    set({
      currentPet: {
        ...pet,
        cleanliness: clamp(pet.cleanliness + CLEAN_EFFECT.cleanliness),
        exp: levelResult.finalExp,
        level: levelResult.newLevel,
      },
      prevLevel: pet.level,
    });

    if (levelResult.leveledUp) {
      set({ showLevelUp: true });
    }

    try {
      await petApi.cleanPet(pet.id);
    } catch (e) {
      console.warn('cleanPet API failed, state already updated locally');
    }

    return levelResult.leveledUp;
  },

  restPet: async () => {
    const pet = get().currentPet;
    if (!pet) return false;

    set({
      currentPet: {
        ...pet,
        energy: clamp(pet.energy + REST_EFFECT.energy),
      },
      prevLevel: pet.level,
    });

    try {
      await petApi.restPet(pet.id);
    } catch (e) {
      console.warn('restPet API failed, state already updated locally');
    }

    return false;
  },

  sendGift: async (toPetId, giftType) => {
    const pet = get().currentPet;
    if (!pet) return { ok: false };
    try {
      const resp = await socialApi.sendGift(pet.id, toPetId, giftType);
      if (resp.success) {
        const prev = get().prevLevel;
        await petApi.getPet(pet.id).then((fresh) => {
          const leveled = fresh.level > prev;
          set({ currentPet: fresh });
          if (leveled) {
            set({ showLevelUp: true, prevLevel: fresh.level });
          }
        });
        return {
          ok: true,
          expGain: resp.senderExpGain,
          happyGain: resp.receiverHappinessGain,
          msg: resp.message
        };
      }
      return { ok: false, msg: resp.message };
    } catch (e: any) {
      return { ok: false, msg: e?.message };
    }
  },

  addFloatingText: (text, color, x = 50, y = 50, offsetX = 0, offsetY = 0, duration = 1100) => {
    const id = uid();
    const ft: FloatingText = { id, text, color, x, y, offsetX, offsetY, duration };
    set({ floatingTexts: [...get().floatingTexts, ft] });
    setTimeout(() => get().removeFloatingText(id), duration);
  },

  removeFloatingText: (id) => {
    set({ floatingTexts: get().floatingTexts.filter(t => t.id !== id) });
  },

  dismissLevelUp: () => set({ showLevelUp: false }),

  setActiveFurniture: (f) => set({ activeFurniture: f }),

  decayTick: () => {
    const pet = get().currentPet;
    if (!pet) return;
    set({
      currentPet: {
        ...pet,
        hunger: clamp(pet.hunger - 0.35),
        happiness: clamp(pet.happiness - 0.25),
        cleanliness: clamp(pet.cleanliness - 0.2),
        energy: clamp(pet.energy + 0.08),
      }
    });
  }
}));
