import { create } from 'zustand';
import React, { createContext, useContext } from 'react';
import type { PlacedFurniture, DesignState } from './moduleA/designEngine';
import type { BudgetState } from './moduleC/budgetCalculator';
import type { Furniture, DesignListItem } from './moduleD/apiService';

interface AppState {
  currentDesignId: string | null;
  isLoggedIn: boolean;
  loadingStates: { [key: string]: boolean };
  isFullscreen: boolean;
  designState: DesignState;
  budgetState: BudgetState;
  furnitureList: Furniture[];
  furnitureMap: Map<string, Furniture>;
  savedDesigns: DesignListItem[];
  history: DesignState[];
  historyIndex: number;
  is3DMode: boolean;
  setCurrentDesignId: (id: string | null) => void;
  setLoggedIn: (value: boolean) => void;
  setLoading: (key: string, value: boolean) => void;
  toggleFullscreen: () => void;
  setDesignState: (state: DesignState) => void;
  setBudgetState: (state: BudgetState) => void;
  setFurnitureList: (list: Furniture[]) => void;
  setSavedDesigns: (designs: DesignListItem[]) => void;
  pushHistory: (state: DesignState) => void;
  undo: () => void;
  redo: () => void;
  setHistoryIndex: (index: number) => void;
  setIs3DMode: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentDesignId: null,
  isLoggedIn: false,
  loadingStates: {},
  isFullscreen: false,
  designState: {
    placedFurniture: [],
    roomImage: null,
    style: 'modern',
  },
  budgetState: {
    groups: [],
    total: 0,
    isLoading: false,
    error: null,
  },
  furnitureList: [],
  furnitureMap: new Map(),
  savedDesigns: [],
  history: [{
    placedFurniture: [],
    roomImage: null,
    style: 'modern',
  }],
  historyIndex: 0,
  is3DMode: false,
  setCurrentDesignId: (id) => set({ currentDesignId: id }),
  setLoggedIn: (value) => set({ isLoggedIn: value }),
  setLoading: (key, value) =>
    set((state) => ({
      loadingStates: { ...state.loadingStates, [key]: value },
    })),
  toggleFullscreen: () =>
    set((state) => ({ isFullscreen: !state.isFullscreen })),
  setDesignState: (designState) => set({ designState }),
  setBudgetState: (budgetState) => set({ budgetState }),
  setFurnitureList: (furnitureList) =>
    set({
      furnitureList,
      furnitureMap: new Map(furnitureList.map((f) => [f.id, f])),
    }),
  setSavedDesigns: (savedDesigns) => set({ savedDesigns }),
  pushHistory: (state) =>
    set((prev) => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(state);
      if (newHistory.length > 50) newHistory.shift();
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),
  undo: () =>
    set((prev) => {
      if (prev.historyIndex <= 0) return prev;
      const newIndex = prev.historyIndex - 1;
      return {
        historyIndex: newIndex,
        designState: prev.history[newIndex],
      };
    }),
  redo: () =>
    set((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const newIndex = prev.historyIndex + 1;
      return {
        historyIndex: newIndex,
        designState: prev.history[newIndex],
      };
    }),
  setHistoryIndex: (historyIndex) => set({ historyIndex }),
  setIs3DMode: (is3DMode) => set({ is3DMode }),
}));

interface DesignContextValue {
  designState: DesignState;
  budgetState: BudgetState;
  furnitureMap: Map<string, Furniture>;
  addFurniture: (furniture: Omit<PlacedFurniture, 'id'>) => void;
  removeFurniture: (id: string) => void;
  updateFurniture: (id: string, updates: Partial<Omit<PlacedFurniture, 'id' | 'furnitureId'>>) => void;
  setRoomImage: (image: string | null) => void;
  setStyle: (style: string) => void;
}

export const DesignContext = createContext<DesignContextValue | null>(null);

export const useDesignContext = () => {
  const ctx = useContext(DesignContext);
  if (!ctx) {
    throw new Error('useDesignContext must be used within DesignContext.Provider');
  }
  return ctx;
};

export const DesignContextProvider: React.FC<{
  value: DesignContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <DesignContext.Provider value={value}>
      {children}
    </DesignContext.Provider>
  );
};
