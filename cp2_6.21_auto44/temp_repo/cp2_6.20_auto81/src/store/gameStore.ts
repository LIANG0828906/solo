import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, StoryNode, SaveData, Attributes } from '../types';

interface GameStore {
  currentNode: StoryNode | null;
  gameState: GameState;
  saves: SaveData[];
  isTyping: boolean;
  displayedText: string;
  sidebarOpen: boolean;

  setCurrentNode: (node: StoryNode) => void;
  setGameState: (state: GameState) => void;
  updateAttributes: (attrs: Partial<Attributes>) => void;
  setIsTyping: (typing: boolean) => void;
  setDisplayedText: (text: string) => void;
  appendDisplayedText: (char: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addSave: (save: SaveData) => void;
  removeSave: (id: string) => void;
  setSaves: (saves: SaveData[]) => void;
  resetGame: () => void;
}

const initialAttributes: Attributes = {
  health: 100,
  sanity: 100,
  gold: 0,
  charisma: 50,
};

const initialGameState: GameState = {
  currentNodeId: '',
  attributes: { ...initialAttributes },
  inventory: [],
  history: [],
  isEnded: false,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      currentNode: null,
      gameState: initialGameState,
      saves: [],
      isTyping: false,
      displayedText: '',
      sidebarOpen: true,

      setCurrentNode: (node) => set({ currentNode: node }),
      setGameState: (state) => set({ gameState: state }),
      updateAttributes: (attrs) =>
        set((s) => ({
          gameState: {
            ...s.gameState,
            attributes: { ...s.gameState.attributes, ...attrs },
          },
        })),
      setIsTyping: (typing) => set({ isTyping: typing }),
      setDisplayedText: (text) => set({ displayedText: text }),
      appendDisplayedText: (char) =>
        set((s) => ({ displayedText: s.displayedText + char })),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      addSave: (save) =>
        set((s) => ({ saves: [save, ...s.saves].slice(0, 10) })),
      removeSave: (id) =>
        set((s) => ({ saves: s.saves.filter((sv) => sv.id !== id) })),
      setSaves: (saves) => set({ saves }),
      resetGame: () =>
        set({
          currentNode: null,
          gameState: initialGameState,
          isTyping: false,
          displayedText: '',
        }),
    }),
    {
      name: 'text-adventure-storage',
      partialize: (state) => ({
        saves: state.saves,
        gameState: state.gameState,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
