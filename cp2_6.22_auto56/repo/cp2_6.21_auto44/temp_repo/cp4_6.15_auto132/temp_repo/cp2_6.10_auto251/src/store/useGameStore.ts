import { create } from 'zustand';
import type { Herb, Task, GameEvent, ScoreReport, DragPosition } from '../types';

interface GameState {
  knowledge: number;
  score: number;
  period: number;
  day: number;
  correctCount: number;
  totalCount: number;
  currentTask: Task | null;
  currentEvent: GameEvent | null;
  scoreReport: ScoreReport | null;
  herbs: Herb[];
  isDragging: boolean;
  dragPosition: DragPosition;
  setTask: (task: Task) => void;
  submitAnswer: (herbId: string) => boolean;
  setEvent: (event: GameEvent) => void;
  resolveEvent: (optionId: string) => void;
  setScoreReport: (report: ScoreReport) => void;
  updateKnowledge: (delta: number) => void;
  incrementDay: () => void;
  startDragging: () => void;
  stopDragging: () => void;
  updateDragPosition: (position: DragPosition) => void;
  resetGame: () => void;
}

const initialState = {
  knowledge: 0,
  score: 0,
  period: 1,
  day: 1,
  correctCount: 0,
  totalCount: 0,
  currentTask: null,
  currentEvent: null,
  scoreReport: null,
  herbs: [],
  isDragging: false,
  dragPosition: { x: 0, y: 0 },
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setTask: (task: Task) => set({ currentTask: task }),

  submitAnswer: (herbId: string) => {
    const { currentTask, correctCount, totalCount, score } = get();
    if (!currentTask) return false;

    const isCorrect = herbId === currentTask.herbId;
    const newCorrectCount = isCorrect ? correctCount + 1 : correctCount;
    const newTotalCount = totalCount + 1;
    const scoreChange = isCorrect ? 10 : 0;

    set({
      currentTask: null,
      correctCount: newCorrectCount,
      totalCount: newTotalCount,
      score: score + scoreChange,
    });

    return isCorrect;
  },

  setEvent: (event: GameEvent) => set({ currentEvent: event }),

  resolveEvent: (optionId: string) => {
    const { currentEvent, knowledge, score } = get();
    if (!currentEvent) return;

    const option = currentEvent.options.find(o => o.id === optionId);
    if (!option) return;

    set({
      currentEvent: null,
      knowledge: knowledge + (option.effect.knowledge || 0),
      score: score + (option.effect.score || 0),
    });
  },

  setScoreReport: (report: ScoreReport) => set({ scoreReport: report }),

  updateKnowledge: (delta: number) => set(state => ({
    knowledge: Math.max(0, state.knowledge + delta),
  })),

  incrementDay: () => set(state => {
    const newDay = state.day + 1;
    if (newDay > 10) {
      return {
        day: 1,
        period: state.period + 1,
      };
    }
    return { day: newDay };
  }),

  startDragging: () => set({ isDragging: true }),

  stopDragging: () => set({ isDragging: false, dragPosition: { x: 0, y: 0 } }),

  updateDragPosition: (position: DragPosition) => set({ dragPosition: position }),

  resetGame: () => set(initialState),
}));
