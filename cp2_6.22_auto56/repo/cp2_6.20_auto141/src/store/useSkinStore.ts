import { create } from 'zustand';
import { SkinData } from '../types';

interface SkinState {
  skin: SkinData;
  playerName: string;
  setColor: (color: string) => void;
  setAccessory: (type: 'glasses' | 'helmet' | 'cape', value: string | null) => void;
  setPlayerName: (name: string) => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'skin';

const defaultSkin: SkinData = {
  color: '#3b82f6',
  accessory: {
    glasses: null,
    helmet: null,
    cape: null,
  },
};

export const useSkinStore = create<SkinState>((set, get) => ({
  skin: defaultSkin,
  playerName: 'Player',

  setColor: (color) => {
    const skin = { ...get().skin, color };
    set({ skin });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ skin, playerName: get().playerName }));
  },

  setAccessory: (type, value) => {
    const skin = {
      ...get().skin,
      accessory: {
        ...get().skin.accessory,
        [type]: value,
      },
    };
    set({ skin });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ skin, playerName: get().playerName }));
  },

  setPlayerName: (name) => {
    set({ playerName: name });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ skin: get().skin, playerName: name }));
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          skin: data.skin || defaultSkin,
          playerName: data.playerName || 'Player',
        });
      }
    } catch (e) {
      console.error('Failed to load skin from localStorage', e);
    }
  },
}));
