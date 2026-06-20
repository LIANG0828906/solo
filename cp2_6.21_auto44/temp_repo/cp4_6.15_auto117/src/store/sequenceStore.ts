import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { parseSequence, type BasePair, type BaseType } from '@/utils/sequenceParser';
import {
  applyPointMutation as simPoint,
  applyInsertion as simInsert,
  applyDeletion as simDelete,
  type MutationEffect,
} from '@/utils/mutationSimulator';

type MutationType = 'point' | 'insertion' | 'deletion';

type MutationRecord = {
  id: string;
  type: MutationType;
  position: number;
  oldBase?: BaseType;
  newBase?: BaseType;
  insertedBases?: BaseType[];
  deletedBases?: BaseType[];
  timestamp: number;
  sequenceSnapshot: string;
};

type ViewParams = {
  autoRotate: boolean;
  rotationSpeed: number;
  zoom: number;
  showLabels: boolean;
  showBackbone: boolean;
  showBases: boolean;
};

type SequenceState = {
  rawSequence: string;
  basePairs: BasePair[];
  mutationHistory: MutationRecord[];
  currentHistoryIndex: number;
  viewParams: ViewParams;
  selectedBaseIndex: number | null;
  isTransitioning: boolean;
  activeMutation: MutationEffect | null;
  setSequence: (seq: string) => void;
  selectBase: (index: number | null) => void;
  applyPointMutation: (position: number, newBase: BaseType) => void;
  applyInsertion: (position: number, bases: BaseType[]) => void;
  applyDeletion: (position: number, count: number) => void;
  revertToHistory: (index: number) => void;
  clearHistory: () => void;
  updateViewParams: (params: Partial<ViewParams>) => void;
  toggleAutoRotate: () => void;
  setActiveMutation: (effect: MutationEffect | null) => void;
  setTransitioning: (value: boolean) => void;
};

const generateRandomSequence = (length: number): string => {
  const bases: BaseType[] = ['A', 'T', 'C', 'G'];
  let sequence = '';
  for (let i = 0; i < length; i++) {
    sequence += bases[Math.floor(Math.random() * 4)];
  }
  return sequence;
};

const validateSequence = (seq: string): boolean => {
  return /^[ATCG]+$/.test(seq.toUpperCase());
};

const sequenceToBasePairs = (seq: string): BasePair[] => {
  return parseSequence(seq);
};

const basePairsToSequence = (basePairs: BasePair[]): string => {
  return basePairs.map((bp) => bp.base1).join('');
};

export const useSequenceStore = create<SequenceState>((set, get) => {
  const initialSequence = generateRandomSequence(100);
  const initialBasePairs = sequenceToBasePairs(initialSequence);

  return {
    rawSequence: initialSequence,
    basePairs: initialBasePairs,
    mutationHistory: [],
    currentHistoryIndex: -1,
    viewParams: {
      autoRotate: true,
      rotationSpeed: 0.005,
      zoom: 1,
      showLabels: false,
      showBackbone: true,
      showBases: true,
    },
    selectedBaseIndex: null,
    isTransitioning: false,
    activeMutation: null,

    setSequence: (seq: string) => {
      if (!validateSequence(seq)) {
        throw new Error('Invalid sequence: must contain only A, T, C, G');
      }
      const upperSeq = seq.toUpperCase();
      const basePairs = sequenceToBasePairs(upperSeq);
      const record: MutationRecord = {
        id: uuidv4(),
        type: 'point',
        position: 0,
        timestamp: Date.now(),
        sequenceSnapshot: upperSeq,
      };
      const history = get().mutationHistory.slice(0, get().currentHistoryIndex + 1);
      history.push(record);
      set({
        rawSequence: upperSeq,
        basePairs,
        mutationHistory: history,
        currentHistoryIndex: history.length - 1,
      });
    },

    selectBase: (index: number | null) => {
      set({ selectedBaseIndex: index });
    },

    applyPointMutation: (position: number, newBase: BaseType) => {
      const { basePairs, mutationHistory, currentHistoryIndex, rawSequence } = get();
      const oldBase = basePairs[position]?.base1;
      const result = simPoint(basePairs, position, newBase);
      const newSequence = basePairsToSequence(result.basePairs);
      const record: MutationRecord = {
        id: uuidv4(),
        type: 'point',
        position,
        oldBase,
        newBase,
        timestamp: Date.now(),
        sequenceSnapshot: newSequence,
      };
      const history = mutationHistory.slice(0, currentHistoryIndex + 1);
      history.push(record);
      set({
        rawSequence: newSequence,
        basePairs: result.basePairs,
        mutationHistory: history,
        currentHistoryIndex: history.length - 1,
        activeMutation: result.effect,
      });
      setTimeout(() => {
        set({ activeMutation: null });
      }, 1500);
    },

    applyInsertion: (position: number, bases: BaseType[]) => {
      const { basePairs, mutationHistory, currentHistoryIndex } = get();
      const result = simInsert(basePairs, position, bases);
      const newSequence = basePairsToSequence(result.basePairs);
      const record: MutationRecord = {
        id: uuidv4(),
        type: 'insertion',
        position,
        insertedBases: bases,
        timestamp: Date.now(),
        sequenceSnapshot: newSequence,
      };
      const history = mutationHistory.slice(0, currentHistoryIndex + 1);
      history.push(record);
      set({
        rawSequence: newSequence,
        basePairs: result.basePairs,
        mutationHistory: history,
        currentHistoryIndex: history.length - 1,
        activeMutation: result.effect,
      });
      setTimeout(() => {
        set({ activeMutation: null });
      }, 1500);
    },

    applyDeletion: (position: number, count: number) => {
      const { basePairs, mutationHistory, currentHistoryIndex } = get();
      const result = simDelete(basePairs, position, count);
      const newSequence = basePairsToSequence(result.basePairs);
      const deletedBases = result.deleted.map((bp) => bp.base1);
      const record: MutationRecord = {
        id: uuidv4(),
        type: 'deletion',
        position,
        deletedBases,
        timestamp: Date.now(),
        sequenceSnapshot: newSequence,
      };
      const history = mutationHistory.slice(0, currentHistoryIndex + 1);
      history.push(record);
      set({
        rawSequence: newSequence,
        basePairs: result.basePairs,
        mutationHistory: history,
        currentHistoryIndex: history.length - 1,
        activeMutation: result.effect,
      });
      setTimeout(() => {
        set({ activeMutation: null });
      }, 1500);
    },

    revertToHistory: (index: number) => {
      const { mutationHistory } = get();
      if (index < -1 || index >= mutationHistory.length) {
        throw new Error('Invalid history index');
      }
      if (index === -1) {
        const initialSequence = generateRandomSequence(100);
        const basePairs = sequenceToBasePairs(initialSequence);
        set({
          rawSequence: initialSequence,
          basePairs,
          currentHistoryIndex: -1,
        });
      } else {
        const record = mutationHistory[index];
        const basePairs = sequenceToBasePairs(record.sequenceSnapshot);
        set({
          rawSequence: record.sequenceSnapshot,
          basePairs,
          currentHistoryIndex: index,
        });
      }
    },

    clearHistory: () => {
      set({
        mutationHistory: [],
        currentHistoryIndex: -1,
      });
    },

    updateViewParams: (params: Partial<ViewParams>) => {
      set((state) => ({
        viewParams: {
          ...state.viewParams,
          ...params,
        },
      }));
    },

    toggleAutoRotate: () => {
      set((state) => ({
        viewParams: {
          ...state.viewParams,
          autoRotate: !state.viewParams.autoRotate,
        },
      }));
    },

    setActiveMutation: (effect: MutationEffect | null) => {
      set({ activeMutation: effect });
    },

    setTransitioning: (value: boolean) => {
      set({ isTransitioning: value });
    },
  };
});
