import { create } from 'zustand';
import type { HistoryEntry } from './story/types';
import { getInitialNode, getNextNode, clearStoryCache } from './story/engine';

interface StoryState {
  currentNodeId: string;
  history: HistoryEntry[];
  isLoading: boolean;
  slideDirection: 'left' | 'right' | null;
  isTransitioning: boolean;

  dispatchChoice: (choiceIndex: 0 | 1, choiceText: string) => void;
  jumpToNode: (historyIndex: number) => void;
  clearHistory: () => void;
  setSlideDirection: (direction: 'left' | 'right' | null) => void;
  setTransitioning: (value: boolean) => void;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  currentNodeId: getInitialNode().id,
  history: [],
  isLoading: false,
  slideDirection: null,
  isTransitioning: false,

  dispatchChoice: (choiceIndex: 0 | 1, choiceText: string) => {
    const { currentNodeId, history } = get();
    
    set({ isLoading: true, isTransitioning: true });

    const entry: HistoryEntry = {
      nodeId: currentNodeId,
      choiceIndex,
      choiceText,
      timestamp: Date.now(),
    };

    const nextNode = getNextNode(currentNodeId, choiceIndex);

    setTimeout(() => {
      set({
        currentNodeId: nextNode.id,
        history: [...history, entry],
        isLoading: false,
        slideDirection: null,
        isTransitioning: false,
      });
    }, 500);
  },

  jumpToNode: (historyIndex: number) => {
    const { history } = get();
    
    if (historyIndex < 0 || historyIndex >= history.length) {
      return;
    }

    const targetEntry = history[historyIndex];
    const newHistory = history.slice(0, historyIndex);

    set({
      currentNodeId: targetEntry.nodeId,
      history: newHistory,
      isLoading: false,
      slideDirection: null,
      isTransitioning: false,
    });
  },

  clearHistory: () => {
    clearStoryCache();
    const initialNode = getInitialNode();
    set({
      currentNodeId: initialNode.id,
      history: [],
      isLoading: false,
      slideDirection: null,
      isTransitioning: false,
    });
  },

  setSlideDirection: (direction: 'left' | 'right' | null) => {
    set({ slideDirection: direction });
  },

  setTransitioning: (value: boolean) => {
    set({ isTransitioning: value });
  },
}));
