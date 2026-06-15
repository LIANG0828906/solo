import { create } from 'zustand';
import type { Player, Boardgame, Activity, ActivityPlayer, PlayerStats } from '@/types';

interface AppState {
  currentPlayer: Player | null;
  boardgames: Boardgame[];
  activities: Activity[];
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;

  setCurrentPlayer: (player: Player | null) => void;
  setBoardgames: (games: Boardgame[]) => void;
  setActivities: (activities: Activity[]) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;

  addActivity: (activity: Activity) => void;
  updateActivity: (activity: Activity) => void;
  addBoardgame: (game: Boardgame) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPlayer: null,
  boardgames: [],
  activities: [],
  sidebarCollapsed: false,
  mobileMenuOpen: false,

  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setBoardgames: (games) => set({ boardgames: games }),
  setActivities: (activities) => set({ activities }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  addActivity: (activity) =>
    set((state) => ({
      activities: [...state.activities, activity].sort(
        (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      ),
    })),
  updateActivity: (activity) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === activity.id ? activity : a
      ),
    })),
  addBoardgame: (game) =>
    set((state) => ({
      boardgames: [...state.boardgames, game].sort((a, b) =>
        a.name.localeCompare(b.name, 'zh')
      ),
    })),
}));

export type { PlayerStats };
