import { create } from 'zustand';
import { TrashType } from '../game/types';

export interface Notification {
  id: number;
  text: string;
  color: string;
  timer: number;
}

interface GameStoreState {
  score: number;
  collectedItems: TrashType[];
  playerLevel: number;
  currentEvent: string | null;
  isPaused: boolean;
  isUpgradeOpen: boolean;
  notifications: Notification[];
  moveSpeedLevel: number;
  basketLevel: number;
  shieldLevel: number;
  nextNotifId: number;

  collectItem: (type: TrashType, score: number) => void;
  depositResult: (correctScore: number, penalty: number, correctCount: number, wrongCount: number) => void;
  upgrade: (type: 'speed' | 'basket' | 'shield', cost: number, newLevel: number) => void;
  triggerEvent: (name: string) => void;
  clearEvent: () => void;
  setPaused: (paused: boolean) => void;
  setUpgradeOpen: (open: boolean) => void;
  addNotification: (text: string, color?: string) => void;
  updateNotifications: (dt: number) => void;
  updateScore: (delta: number) => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  score: 0,
  collectedItems: [],
  playerLevel: 1,
  currentEvent: null,
  isPaused: false,
  isUpgradeOpen: false,
  notifications: [],
  moveSpeedLevel: 0,
  basketLevel: 0,
  shieldLevel: 0,
  nextNotifId: 0,

  collectItem: (type, score) => {
    set(state => ({
      collectedItems: [...state.collectedItems, type],
      score: state.score + score,
    }));
    get().addNotification(`+${score}`, '#FFD700');
  },

  depositResult: (correctScore, penalty, correctCount, wrongCount) => {
    set(state => ({
      collectedItems: [],
      score: state.score + correctScore - penalty,
    }));
    if (correctCount > 0) {
      get().addNotification(`正确回收 x${correctCount}! +${correctScore}`, '#00FF00');
    }
    if (wrongCount > 0) {
      get().addNotification(`分类错误 x${wrongCount}! -${penalty}`, '#FF4444');
    }
  },

  upgrade: (type, cost, newLevel) => {
    const state = get();
    if (state.score < cost) return;
    set({
      score: state.score - cost,
      [type === 'speed' ? 'moveSpeedLevel' : type === 'basket' ? 'basketLevel' : 'shieldLevel']: newLevel,
    });
    get().addNotification('升级成功!', '#00FFFF');
  },

  triggerEvent: (name) => {
    set({ currentEvent: name });
    get().addNotification(name, '#FF6666');
  },

  clearEvent: () => set({ currentEvent: null }),

  setPaused: (paused) => set({ isPaused: paused }),

  setUpgradeOpen: (open) => set({ isUpgradeOpen: open }),

  addNotification: (text, color = '#FFFFFF') => {
    set(state => ({
      notifications: [...state.notifications, { id: state.nextNotifId, text, color, timer: 3 }],
      nextNotifId: state.nextNotifId + 1,
    }));
  },

  updateNotifications: (dt) => {
    set(state => ({
      notifications: state.notifications
        .map(n => ({ ...n, timer: n.timer - dt }))
        .filter(n => n.timer > 0),
    }));
  },

  updateScore: (delta) => {
    set(state => ({ score: state.score + delta }));
  },
}));
