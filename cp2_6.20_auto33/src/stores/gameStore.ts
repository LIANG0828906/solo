import { create } from 'zustand';
import type {
  Pet, FloatingText, FurnitureType, FoodType, GiftType, CreatePetData
} from '../types';
import { petApi, socialApi } from '../api';
import { uid } from '../utils/helpers';

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
  addFloatingText: (text: string, color: string, x?: number, y?: number) => void;
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
    const resp = await petApi.feedPet(pet.id, foodType);
    const leveledUp = resp.pet.level > get().prevLevel;
    set({ currentPet: resp.pet });
    if (leveledUp) {
      set({ showLevelUp: true, prevLevel: resp.pet.level });
    }
    return leveledUp;
  },

  playPet: async () => {
    const pet = get().currentPet;
    if (!pet) return false;
    const resp = await petApi.playPet(pet.id);
    const leveledUp = resp.pet.level > get().prevLevel;
    set({ currentPet: resp.pet });
    if (leveledUp) {
      set({ showLevelUp: true, prevLevel: resp.pet.level });
    }
    return leveledUp;
  },

  cleanPet: async () => {
    const pet = get().currentPet;
    if (!pet) return false;
    const resp = await petApi.cleanPet(pet.id);
    const leveledUp = resp.pet.level > get().prevLevel;
    set({ currentPet: resp.pet });
    if (leveledUp) {
      set({ showLevelUp: true, prevLevel: resp.pet.level });
    }
    return leveledUp;
  },

  restPet: async () => {
    const pet = get().currentPet;
    if (!pet) return false;
    const resp = await petApi.restPet(pet.id);
    set({ currentPet: resp.pet });
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

  addFloatingText: (text, color, x = 50, y = 50) => {
    const id = uid();
    const ft: FloatingText = { id, text, color, x, y };
    set({ floatingTexts: [...get().floatingTexts, ft] });
    setTimeout(() => get().removeFloatingText(id), 1100);
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
        hunger: Math.max(0, pet.hunger - 0.35),
        happiness: Math.max(0, pet.happiness - 0.25),
        cleanliness: Math.max(0, pet.cleanliness - 0.2),
        energy: Math.min(100, pet.energy + 0.08),
      }
    });
  }
}));
