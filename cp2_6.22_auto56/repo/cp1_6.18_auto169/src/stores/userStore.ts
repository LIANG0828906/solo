import { create } from 'zustand';
import { PetInstance, TOTAL_SLOTS } from '@/data/petData';

interface UserState {
  userId: string;
  nickname: string;
  avatar: string;
  points: number;
  pets: PetInstance[];
  selectedPetUid: string | null;
  addPet: (pet: PetInstance) => void;
  removePet: (uid: string) => void;
  selectPet: (uid: string | null) => void;
  deductPoints: (amount: number) => boolean;
  addPoints: (amount: number) => void;
  getNextSlot: () => number;
}

const STORAGE_KEY = 'yunbaoge_user_state';

function loadState(): Partial<UserState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveState(state: UserState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      userId: state.userId,
      nickname: state.nickname,
      avatar: state.avatar,
      points: state.points,
      pets: state.pets,
    }));
  } catch { /* ignore */ }
}

const saved = loadState();

export const useUserStore = create<UserState>((set, get) => ({
  userId: saved?.userId ?? 'user_001',
  nickname: saved?.nickname ?? '云宝收藏家',
  avatar: saved?.avatar ?? '🐾',
  points: saved?.points ?? 500,
  pets: saved?.pets ?? [],
  selectedPetUid: null,

  addPet: (pet: PetInstance) => {
    set((s) => {
      const updated = { ...s, pets: [...s.pets, pet] };
      saveState(updated as UserState);
      return updated;
    });
  },

  removePet: (uid: string) => {
    set((s) => {
      const updated = { ...s, pets: s.pets.filter((p) => p.uid !== uid) };
      saveState(updated as UserState);
      return updated;
    });
  },

  selectPet: (uid: string | null) => {
    set({ selectedPetUid: uid });
  },

  deductPoints: (amount: number) => {
    const s = get();
    if (s.points < amount) return false;
    const updated = { ...s, points: s.points - amount };
    set(updated);
    saveState(updated as UserState);
    return true;
  },

  addPoints: (amount: number) => {
    set((s) => {
      const updated = { ...s, points: s.points + amount };
      saveState(updated as UserState);
      return updated;
    });
  },

  getNextSlot: () => {
    const occupied = new Set(get().pets.map((p) => p.slotIndex));
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      if (!occupied.has(i)) return i;
    }
    return -1;
  },
}));
