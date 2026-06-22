import { create } from 'zustand';
import { AlgorithmType, SortStep } from '../algorithms/types';
import { generateSortSteps, generateRandomArray } from '../algorithms/generator';

interface SortState {
  array: number[];
  originalArray: number[];
  steps: SortStep[];
  currentStepIndex: number;
  algorithm: AlgorithmType;
  isPlaying: boolean;
  comparisons: number;
  swaps: number;
  startTime: number | null;
  elapsedTime: number;

  generateNewArray: () => void;
  setAlgorithm: (algo: AlgorithmType) => void;
  stepForward: () => void;
  stepBackward: () => void;
  reset: () => void;
  togglePlay: () => void;
  updateElapsedTime: () => void;
  stopPlaying: () => void;
}

const initialArray = generateRandomArray();
const initialSteps = generateSortSteps('bubble', initialArray);

export const useSortStore = create<SortState>((set, get) => ({
  array: initialArray,
  originalArray: initialArray,
  steps: initialSteps,
  currentStepIndex: 0,
  algorithm: 'bubble',
  isPlaying: false,
  comparisons: 0,
  swaps: 0,
  startTime: null,
  elapsedTime: 0,

  generateNewArray: () => {
    const newArray = generateRandomArray();
    const { algorithm } = get();
    const newSteps = generateSortSteps(algorithm, newArray);
    set({
      array: newArray,
      originalArray: newArray,
      steps: newSteps,
      currentStepIndex: 0,
      isPlaying: false,
      comparisons: 0,
      swaps: 0,
      startTime: null,
      elapsedTime: 0,
    });
  },

  setAlgorithm: (algo: AlgorithmType) => {
    const { originalArray } = get();
    const newSteps = generateSortSteps(algo, originalArray);
    set({
      algorithm: algo,
      steps: newSteps,
      currentStepIndex: 0,
      isPlaying: false,
      array: originalArray,
      comparisons: 0,
      swaps: 0,
      startTime: null,
      elapsedTime: 0,
    });
  },

  stepForward: () => {
    const { steps, currentStepIndex, startTime } = get();
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const step = steps[nextIndex];
      set({
        currentStepIndex: nextIndex,
        array: step.arraySnapshot,
        comparisons: step.comparisons,
        swaps: step.swaps,
        startTime: startTime === null ? performance.now() : startTime,
      });
    } else {
      set({ isPlaying: false });
    }
  },

  stepBackward: () => {
    const { steps, currentStepIndex } = get();
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      const step = steps[prevIndex];
      set({
        currentStepIndex: prevIndex,
        array: step.arraySnapshot,
        comparisons: step.comparisons,
        swaps: step.swaps,
      });
    }
  },

  reset: () => {
    const { originalArray } = get();
    set({
      currentStepIndex: 0,
      array: originalArray,
      comparisons: 0,
      swaps: 0,
      isPlaying: false,
      startTime: null,
      elapsedTime: 0,
    });
  },

  togglePlay: () => {
    const { isPlaying, steps, currentStepIndex, startTime } = get();
    if (!isPlaying) {
      if (currentStepIndex >= steps.length - 1) {
        const { originalArray, algorithm } = get();
        const newSteps = generateSortSteps(algorithm, originalArray);
        set({
          steps: newSteps,
          currentStepIndex: 0,
          array: originalArray,
          comparisons: 0,
          swaps: 0,
          isPlaying: true,
          startTime: performance.now(),
          elapsedTime: 0,
        });
      } else {
        set({
          isPlaying: true,
          startTime: startTime === null ? performance.now() : startTime,
        });
      }
    } else {
      set({ isPlaying: false });
    }
  },

  updateElapsedTime: () => {
    const { startTime, isPlaying, elapsedTime } = get();
    if (isPlaying && startTime !== null) {
      set({ elapsedTime: performance.now() - startTime });
    }
    return elapsedTime;
  },

  stopPlaying: () => {
    set({ isPlaying: false });
  },
}));
