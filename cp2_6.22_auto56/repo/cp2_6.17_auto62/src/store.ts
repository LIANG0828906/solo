import { create } from 'zustand';
import { HistoryNode, ChoiceDirection } from './story/types';
import { getNextNode, resetStoryEngine } from './story/engine';

interface StoryState {
  currentNodeId: string | null;
  history: HistoryNode[];
  currentHistoryIndex: number;
  isLoading: boolean;
  initStory: () => void;
  makeChoice: (direction: ChoiceDirection) => void;
  jumpToHistory: (historyIndex: number) => void;
  clearHistory: () => void;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  currentNodeId: null,
  history: [],
  currentHistoryIndex: -1,
  isLoading: false,

  initStory: () => {
    const node = getNextNode(null, null);
    const historyNode: HistoryNode = {
      nodeId: node.id,
      timestamp: Date.now(),
      depth: 0,
      parentIndex: null,
    };
    set({
      currentNodeId: node.id,
      history: [historyNode],
      currentHistoryIndex: 0,
      isLoading: false,
    });
  },

  makeChoice: (direction: ChoiceDirection) => {
    const { currentNodeId, history, currentHistoryIndex } = get();
    if (!currentNodeId) return;

    set({ isLoading: true });

    requestAnimationFrame(() => {
      const nextNode = getNextNode(currentNodeId, direction);
      const currentHistNode = history[currentHistoryIndex];

      const choiceIndex = direction === 'left' ? 0 : 1;
      const node = getNextNode(currentNodeId, direction);
      const choice = node.choices[choiceIndex];

      const newHistoryNode: HistoryNode = {
        nodeId: nextNode.id,
        choiceId: choice.id,
        choiceText: choice.text,
        timestamp: Date.now(),
        depth: currentHistNode.depth + 1,
        parentIndex: currentHistoryIndex,
      };

      const newHistory = history.slice(0, currentHistoryIndex + 1);
      newHistory.push(newHistoryNode);

      set({
        currentNodeId: nextNode.id,
        history: newHistory,
        currentHistoryIndex: newHistory.length - 1,
        isLoading: false,
      });
    });
  },

  jumpToHistory: (historyIndex: number) => {
    const { history } = get();
    if (historyIndex < 0 || historyIndex >= history.length) return;

    set({ isLoading: true });

    requestAnimationFrame(() => {
      const targetNodeId = history[historyIndex].nodeId;
      set({
        currentNodeId: targetNodeId,
        currentHistoryIndex: historyIndex,
        isLoading: false,
      });
    });
  },

  clearHistory: () => {
    resetStoryEngine();
    set({
      currentNodeId: null,
      history: [],
      currentHistoryIndex: -1,
      isLoading: false,
    });
    get().initStory();
  },
}));
