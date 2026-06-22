import { create } from 'zustand';
import type { StoryNode, PlayerProfile, Decision } from '@/types';

interface GameState {
  playerId: string;
  nickname: string;
  currentNode: StoryNode | null;
  playerProfile: PlayerProfile | null;
  currentNodeId: string;
  score: number;
  decisions: Decision[];
  isLoading: boolean;
  isPanelOpen: boolean;
  totalNodes: number;
}

interface GameActions {
  setPlayer: (id: string, nickname: string) => void;
  setCurrentNode: (node: StoryNode) => void;
  addDecision: (decision: Decision) => void;
  setPlayerProfile: (profile: PlayerProfile) => void;
  setLoading: (loading: boolean) => void;
  togglePanel: () => void;
  getProgress: () => number;
  completeGame: () => void;
  resetGame: () => void;
}

const initialState: GameState = {
  playerId: '',
  nickname: '',
  currentNode: null,
  playerProfile: null,
  currentNodeId: '',
  score: 0,
  decisions: [],
  isLoading: false,
  isPanelOpen: false,
  totalNodes: 11,
};

export const useGameStore = create<GameState & GameActions>()((set, get) => ({
  ...initialState,

  setPlayer: (id, nickname) => set({ playerId: id, nickname }),

  setCurrentNode: (node) => set({ currentNode: node, currentNodeId: node.id }),

  addDecision: (decision) =>
    set((state) => ({
      decisions: [...state.decisions, decision],
      score: state.score + decision.score,
    })),

  setPlayerProfile: (profile) => set({ playerProfile: profile }),

  setLoading: (loading) => set({ isLoading: loading }),

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  getProgress: () => {
    const { decisions, totalNodes } = get();
    return (decisions.length / totalNodes) * 100;
  },

  completeGame: () =>
    set((state) => ({
      playerProfile: state.playerProfile
        ? { ...state.playerProfile, completed: true }
        : null,
    })),

  resetGame: () => set(initialState),
}));
