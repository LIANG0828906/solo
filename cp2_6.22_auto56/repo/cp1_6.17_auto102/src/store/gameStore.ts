import { create } from 'zustand';
import { BandParams, WaveformData } from '../SpectrumEngine';
import { SecurityStatus } from '../SecurityModule';

interface BreachNotification {
  id: number;
  message: string;
  visible: boolean;
}

interface GameState {
  bandParams: BandParams;
  waveformData: WaveformData | null;
  securityStatus: SecurityStatus | null;
  gameTime: number;
  breachCount: number;
  gameWon: boolean;
  startTime: number;
  breachNotifications: BreachNotification[];

  setBandParams: (params: Partial<BandParams>) => void;
  setWaveformData: (data: WaveformData) => void;
  setSecurityStatus: (status: SecurityStatus) => void;
  updateGameTime: () => void;
  incrementBreachCount: () => void;
  setGameWon: (won: boolean) => void;
  addBreachNotification: (message: string) => void;
  removeBreachNotification: (id: number) => void;
  resetGame: () => void;
}

const initialParams: BandParams = {
  low: { frequency: 5, intensity: 50, phase: 0 },
  mid: { frequency: 30, intensity: 50, phase: 0 },
  high: { frequency: 75, intensity: 50, phase: 0 },
};

export const useGameStore = create<GameState>((set) => ({
  bandParams: initialParams,
  waveformData: null,
  securityStatus: null,
  gameTime: 0,
  breachCount: 0,
  gameWon: false,
  startTime: Date.now(),
  breachNotifications: [],

  setBandParams: (params) =>
    set((state) => ({
      bandParams: { ...state.bandParams, ...params },
    })),

  setWaveformData: (data) => set({ waveformData: data }),

  setSecurityStatus: (status) => set({ securityStatus: status }),

  updateGameTime: () =>
    set((state) => ({
      gameTime: Math.floor((Date.now() - state.startTime) / 1000),
    })),

  incrementBreachCount: () =>
    set((state) => ({ breachCount: state.breachCount + 1 })),

  setGameWon: (won) => set({ gameWon: won }),

  addBreachNotification: (message) =>
    set((state) => ({
      breachNotifications: [
        ...state.breachNotifications,
        { id: Date.now(), message, visible: true },
      ],
    })),

  removeBreachNotification: (id) =>
    set((state) => ({
      breachNotifications: state.breachNotifications.filter((n) => n.id !== id),
    })),

  resetGame: () =>
    set({
      bandParams: initialParams,
      waveformData: null,
      securityStatus: null,
      gameTime: 0,
      breachCount: 0,
      gameWon: false,
      startTime: Date.now(),
      breachNotifications: [],
    }),
}));
