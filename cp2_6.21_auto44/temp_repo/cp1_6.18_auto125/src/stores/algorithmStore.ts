import { create } from 'zustand';
import type { AlgorithmType, PlaybackState, StepSnapshot } from '../utils/colorUtils';
import { AlgorithmExecutor } from '../engine/algorithmExecutor';

interface AlgorithmStore {
  algorithmType: AlgorithmType;
  currentStepIndex: number;
  snapshots: StepSnapshot[];
  playbackState: PlaybackState;
  speed: number;
  executor: AlgorithmExecutor | null;

  setAlgorithm: (type: AlgorithmType) => void;
  nextStep: () => void;
  prevStep: () => void;
  jumpToStep: (index: number) => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  reset: () => void;
}

export const useAlgorithmStore = create<AlgorithmStore>((set, get) => {
  const initialType: AlgorithmType = 'eightQueens';
  const initialExecutor = new AlgorithmExecutor(initialType);

  return {
    algorithmType: initialType,
    currentStepIndex: 0,
    snapshots: initialExecutor.getAllSnapshots(),
    playbackState: 'idle',
    speed: 1,
    executor: initialExecutor,

    setAlgorithm: (type: AlgorithmType) => {
      const executor = new AlgorithmExecutor(type);
      set({
        algorithmType: type,
        currentStepIndex: 0,
        snapshots: executor.getAllSnapshots(),
        playbackState: 'idle',
        executor,
      });
    },

    nextStep: () => {
      const { currentStepIndex, snapshots } = get();
      if (currentStepIndex < snapshots.length - 1) {
        set({ currentStepIndex: currentStepIndex + 1 });
      } else {
        set({ playbackState: 'paused' });
      }
    },

    prevStep: () => {
      const { currentStepIndex } = get();
      if (currentStepIndex > 0) {
        set({ currentStepIndex: currentStepIndex - 1 });
      }
    },

    jumpToStep: (index: number) => {
      const { snapshots } = get();
      if (index >= 0 && index < snapshots.length) {
        set({ currentStepIndex: index });
      }
    },

    togglePlay: () => {
      const { playbackState, currentStepIndex, snapshots } = get();
      if (playbackState === 'playing') {
        set({ playbackState: 'paused' });
      } else {
        if (currentStepIndex >= snapshots.length - 1) {
          set({ currentStepIndex: 0 });
        }
        set({ playbackState: 'playing' });
      }
    },

    setSpeed: (speed: number) => {
      set({ speed: Math.max(0.5, Math.min(3, speed)) });
    },

    reset: () => {
      const { algorithmType } = get();
      const executor = new AlgorithmExecutor(algorithmType);
      set({
        currentStepIndex: 0,
        snapshots: executor.getAllSnapshots(),
        playbackState: 'idle',
        executor,
      });
    },
  };
});
