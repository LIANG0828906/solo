import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Block, BlockType, CenterOfMass, HistoryState, FragmentData } from '@/types';
import { COLORS, MAX_HISTORY } from '@/types';

interface GameState {
  blocks: Block[];
  selectedType: BlockType | null;
  centerOfMass: CenterOfMass;
  isCollapsed: boolean;
  fragments: FragmentData[];
  history: HistoryState[];
  historyIndex: number;
  isTransitioning: boolean;

  setSelectedType: (type: BlockType | null) => void;
  addBlock: (type: BlockType, position: [number, number, number]) => void;
  removeBlock: (id: string) => void;
  updatePosition: (id: string, position: [number, number, number]) => void;
  clearAll: () => void;
  triggerCollapse: (fragments: FragmentData[], velocities: { id: string; velocity: [number, number, number] }[]) => void;
  updateCenterOfMass: (com: CenterOfMass) => void;
  resetCollapse: () => void;
  updateFragments: (fragments: FragmentData[]) => void;
  updateBlockVelocities: (velocities: { id: string; velocity: [number, number, number] }[]) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  setTransitioning: (v: boolean) => void;
}

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const initialCOM: CenterOfMass = {
  position: [0, 0, 0],
  offsetPercent: 0,
  isOutOfBounds: false,
  totalMass: 0,
  supportRadius: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  blocks: [],
  selectedType: null,
  centerOfMass: initialCOM,
  isCollapsed: false,
  fragments: [],
  history: [{ blocks: [], timestamp: Date.now() }],
  historyIndex: 0,
  isTransitioning: false,

  setSelectedType: (type) => set({ selectedType: type }),

  addBlock: (type, position) => {
    const newBlock: Block = {
      id: uuidv4(),
      type,
      position,
      color: getRandomColor(),
    };
    set((state) => {
      const newBlocks = [...state.blocks, newBlock];
      return { blocks: newBlocks };
    });
    get().pushHistory();
  },

  removeBlock: (id) => {
    set((state) => ({
      blocks: state.blocks.filter((b) => b.id !== id),
    }));
    get().pushHistory();
  },

  updatePosition: (id, position) => {
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, position } : b
      ),
    }));
  },

  clearAll: () => {
    set({ blocks: [], fragments: [], isCollapsed: false });
    get().pushHistory();
  },

  triggerCollapse: (fragments, velocities) => {
    set((state) => {
      const updatedBlocks = state.blocks.map((block) => {
        const v = velocities.find((v) => v.id === block.id);
        return {
          ...block,
          velocity: v?.velocity || [0, 0, 0],
          isCollapsed: true,
        };
      });
      return {
        blocks: updatedBlocks,
        fragments,
        isCollapsed: true,
      };
    });
  },

  updateCenterOfMass: (com) => set({ centerOfMass: com }),

  resetCollapse: () => set({ isCollapsed: false, fragments: [] }),

  updateFragments: (fragments) => set({ fragments }),

  updateBlockVelocities: (velocities) => {
    set((state) => ({
      blocks: state.blocks.map((block) => {
        const v = velocities.find((v) => v.id === block.id);
        return v ? { ...block, velocity: v.velocity } : block;
      }),
    }));
  },

  undo: () => {
    const { history, historyIndex, isTransitioning } = get();
    if (historyIndex <= 0 || isTransitioning) return;
    const newIndex = historyIndex - 1;
    set({
      historyIndex: newIndex,
      blocks: JSON.parse(JSON.stringify(history[newIndex].blocks)),
      isCollapsed: false,
      fragments: [],
      isTransitioning: true,
    });
    setTimeout(() => set({ isTransitioning: false }), 300);
  },

  redo: () => {
    const { history, historyIndex, isTransitioning } = get();
    if (historyIndex >= history.length - 1 || isTransitioning) return;
    const newIndex = historyIndex + 1;
    set({
      historyIndex: newIndex,
      blocks: JSON.parse(JSON.stringify(history[newIndex].blocks)),
      isCollapsed: false,
      fragments: [],
      isTransitioning: true,
    });
    setTimeout(() => set({ isTransitioning: false }), 300);
  },

  pushHistory: () => {
    const { blocks, historyIndex, history } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      blocks: JSON.parse(JSON.stringify(blocks)),
      timestamp: Date.now(),
    });
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    } else {
      set({ historyIndex: newHistory.length - 1 });
    }
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  setTransitioning: (v) => set({ isTransitioning: v }),
}));
