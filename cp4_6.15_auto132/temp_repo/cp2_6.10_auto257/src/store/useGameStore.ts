import { create } from 'zustand';
import type { GameState, Herb, Task, GameEvent, ScoreReport, RecipeSlot } from '../types';

const initialRecipeSlots: RecipeSlot = {
  monarch: null,
  minister: null,
  assistant: null,
  guide: null,
};

const initialState: GameState = {
  day: 1,
  period: 1,
  knowledge: 50,
  correctCount: 0,
  wrongCount: 0,
  completedRecipes: 0,
  eventScore: 0,
  currentTask: null,
  availableHerbs: [],
  collectedHerbs: [],
  recipeSlots: initialRecipeSlots,
  currentEvent: null,
  showScoreReport: false,
  scoreReport: null,
  feedback: {
    type: null,
    message: '',
    herbId: null,
  },
};

export const useGameStore = create<GameState & {
  setTask: (task: Task, herbs: Herb[]) => void;
  submitHerb: (herbId: string, correct: boolean, message: string) => void;
  addToRecipe: (slot: keyof RecipeSlot, herb: Herb) => void;
  removeFromRecipe: (slot: keyof RecipeSlot) => void;
  clearRecipe: () => void;
  completeRecipe: () => void;
  setEvent: (event: GameEvent | null) => void;
  handleEventResult: (scoreEffect: number, knowledgeEffect: number, message: string) => void;
  setFeedback: (type: 'success' | 'error' | null, message: string, herbId: string | null) => void;
  nextDay: () => void;
  showScore: (report: ScoreReport) => void;
  closeScoreReport: () => void;
  resetGame: () => void;
}>((set, get) => ({
  ...initialState,

  setTask: (task: Task, herbs: Herb[]) => {
    set({
      currentTask: task,
      availableHerbs: herbs,
      feedback: { type: null, message: '', herbId: null },
    });
  },

  submitHerb: (herbId: string, correct: boolean, message: string) => {
    const state = get();
    const herb = state.availableHerbs.find(h => h.id === herbId);
    
    if (correct && herb) {
      const alreadyCollected = state.collectedHerbs.some(h => h.id === herbId);
      set({
        knowledge: Math.min(100, state.knowledge + 5),
        correctCount: state.correctCount + 1,
        collectedHerbs: alreadyCollected ? state.collectedHerbs : [...state.collectedHerbs, herb],
        feedback: { type: 'success', message, herbId },
      });
    } else {
      set({
        knowledge: Math.max(0, state.knowledge - 3),
        wrongCount: state.wrongCount + 1,
        feedback: { type: 'error', message, herbId },
      });
    }

    setTimeout(() => {
      set({ feedback: { type: null, message: '', herbId: null } });
    }, 1500);
  },

  addToRecipe: (slot: keyof RecipeSlot, herb: Herb) => {
    set(state => ({
      recipeSlots: {
        ...state.recipeSlots,
        [slot]: herb,
      },
    }));
  },

  removeFromRecipe: (slot: keyof RecipeSlot) => {
    set(state => ({
      recipeSlots: {
        ...state.recipeSlots,
        [slot]: null,
      },
    }));
  },

  clearRecipe: () => {
    set({ recipeSlots: initialRecipeSlots });
  },

  completeRecipe: () => {
    set(state => ({
      completedRecipes: state.completedRecipes + 1,
      recipeSlots: initialRecipeSlots,
    }));
  },

  setEvent: (event: GameEvent | null) => {
    set({ currentEvent: event });
  },

  handleEventResult: (scoreEffect: number, knowledgeEffect: number, message: string) => {
    set(state => ({
      eventScore: Math.max(0, Math.min(100, state.eventScore + scoreEffect)),
      knowledge: Math.max(0, Math.min(100, state.knowledge + knowledgeEffect)),
      currentEvent: null,
    }));
    console.log(message);
  },

  setFeedback: (type: 'success' | 'error' | null, message: string, herbId: string | null) => {
    set({ feedback: { type, message, herbId } });
  },

  nextDay: () => {
    const state = get();
    if (state.day >= 10) {
      set({ day: 1, period: state.period + 1 });
    } else {
      set({ day: state.day + 1 });
    }
  },

  showScore: (report: ScoreReport) => {
    set({
      scoreReport: report,
      showScoreReport: true,
    });
  },

  closeScoreReport: () => {
    set({ showScoreReport: false });
  },

  resetGame: () => {
    set(initialState);
  },
}));
