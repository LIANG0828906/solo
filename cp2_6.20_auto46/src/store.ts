import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import {
  REAGENT_LIST,
  REACTION_DATABASE,
  type BeakerReagent,
  type Recipe,
  type RecipeStep,
  type ReactionRecord,
  type Reaction,
  type RGBA,
  mixColors,
} from './types';

interface DragState {
  isDragging: boolean;
  reagentId: string | null;
  x: number;
  y: number;
  trail: Array<{ x: number; y: number; color: string; alpha: number }>;
}

interface LabStore {
  reagents: typeof REAGENT_LIST;
  beakerReagents: BeakerReagent[];
  beakerColor: RGBA;
  currentReaction: Reaction | null;
  temperature: number;
  isHeating: boolean;
  equationDisplay: string;
  phenomena: Array<{ type: string; active: boolean }>;
  recipes: Recipe[];
  history: ReactionRecord[];
  drag: DragState;
  selectedRecipeId: string | null;
  activeTags: string[];
  modalReagentId: string | null;
  modalOpen: boolean;
  modalClosing: boolean;

  addReagentToBeaker: (reagentId: string, amount: number) => void;
  clearBeaker: () => void;
  startDrag: (reagentId: string, x: number, y: number) => void;
  updateDrag: (x: number, y: number) => void;
  endDrag: () => void;
  saveRecipe: (name: string, tags: string[], coverImage: string) => void;
  deleteRecipe: (id: string) => void;
  loadRecipe: (id: string) => void;
  selectRecipe: (id: string | null) => void;
  toggleTag: (tag: string) => void;
  openModal: (reagentId: string) => void;
  closeModal: () => void;
  loadHistoryRecord: (record: ReactionRecord) => void;
  updateRecipeNotes: (id: string, notes: string) => void;
}

const initialDragState: DragState = {
  isDragging: false,
  reagentId: null,
  x: 0,
  y: 0,
  trail: [],
};

export const useLabStore = create<LabStore>((set, get) => ({
  reagents: REAGENT_LIST,
  beakerReagents: [],
  beakerColor: { r: 220, g: 235, b: 245, a: 0.2 },
  currentReaction: null,
  temperature: 20,
  isHeating: false,
  equationDisplay: '',
  phenomena: [],
  recipes: [],
  history: [],
  drag: initialDragState,
  selectedRecipeId: null,
  activeTags: [],
  modalReagentId: null,
  modalOpen: false,
  modalClosing: false,

  addReagentToBeaker: (reagentId, amount) => {
    const state = get();
    const existing = state.beakerReagents.find((b) => b.reagentId === reagentId);
    let newBeakerReagents: BeakerReagent[];
    if (existing) {
      newBeakerReagents = state.beakerReagents.map((b) =>
        b.reagentId === reagentId ? { ...b, amount: b.amount + amount } : b
      );
    } else {
      newBeakerReagents = [...state.beakerReagents, { reagentId, amount }];
    }

    const reagentIds = newBeakerReagents.map((b) => b.reagentId);
    let matchedReaction: Reaction | null = null;
    for (const reaction of REACTION_DATABASE) {
      if (reaction.reagents.every((r) => reagentIds.includes(r)) && reagentIds.every((r) => reaction.reagents.includes(r))) {
        matchedReaction = reaction;
        break;
      }
    }

    const reagentColors = newBeakerReagents.map((b) => {
      const r = REAGENT_LIST.find((rr) => rr.id === b.reagentId);
      return r ? { ...r.colorRGBA, a: r.colorRGBA.a * Math.min(b.amount / 50, 1) } : { r: 200, g: 200, b: 200, a: 0.2 };
    });

    const newColor = matchedReaction ? matchedReaction.resultColor : mixColors(reagentColors);
    const newTemp = matchedReaction ? 20 + matchedReaction.heatProduced : state.temperature;
    const newPhenomena = matchedReaction
      ? matchedReaction.phenomena.map((p) => ({ type: p.type, active: true }))
      : [];

    const newHistory: ReactionRecord | null = matchedReaction
      ? {
          id: uuidv4(),
          reagents: matchedReaction.reagents,
          equation: matchedReaction.equation,
          phenomenaEmoji: matchedReaction.phenomena.map((p) => {
            if (p.type === 'color_change') return '🌈';
            if (p.type === 'precipitate') return '🌊';
            if (p.type === 'bubbling') return '💨';
            return '🔥';
          }),
          resultColor: matchedReaction.resultColor,
          timestamp: dayjs().format('HH:mm:ss'),
          description: matchedReaction.phenomena.map((p) => p.description).join('；'),
          beakerReagents: [...newBeakerReagents],
        }
      : null;

    set({
      beakerReagents: newBeakerReagents,
      beakerColor: newColor,
      currentReaction: matchedReaction,
      equationDisplay: matchedReaction ? matchedReaction.equation : '',
      temperature: newTemp,
      isHeating: matchedReaction ? matchedReaction.heatProduced > 0 : false,
      phenomena: newPhenomena,
      history: newHistory ? [newHistory, ...state.history] : state.history,
    });
  },

  clearBeaker: () =>
    set({
      beakerReagents: [],
      beakerColor: { r: 220, g: 235, b: 245, a: 0.2 },
      currentReaction: null,
      temperature: 20,
      isHeating: false,
      equationDisplay: '',
      phenomena: [],
    }),

  startDrag: (reagentId, x, y) => {
    const r = REAGENT_LIST.find((rr) => rr.id === reagentId);
    set({
      drag: {
        isDragging: true,
        reagentId,
        x,
        y,
        trail: [{ x, y, color: r?.color || '#ccc', alpha: 0.5 }],
      },
    });
  },

  updateDrag: (x, y) => {
    const state = get();
    if (!state.drag.isDragging) return;
    const r = REAGENT_LIST.find((rr) => rr.id === state.drag.reagentId);
    const newTrail = [...state.drag.trail, { x, y, color: r?.color || '#ccc', alpha: 0.5 }];
    if (newTrail.length > 20) newTrail.shift();
    set({
      drag: { ...state.drag, x, y, trail: newTrail },
    });
  },

  endDrag: () => set({ drag: initialDragState }),

  saveRecipe: (name, tags, coverImage) => {
    const state = get();
    if (state.beakerReagents.length === 0) return;
    const steps: RecipeStep[] = state.beakerReagents.map((b, i) => ({
      id: i + 1,
      reagentId: b.reagentId,
      amount: b.amount,
    }));
    const recipe: Recipe = {
      id: uuidv4(),
      name,
      steps,
      coverImage,
      tags,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
      reactionTime: Math.round(state.beakerReagents.reduce((s, b) => s + b.amount, 0) * 0.5),
      notes: '',
    };
    set({ recipes: [recipe, ...state.recipes] });
  },

  deleteRecipe: (id) => {
    const state = get();
    set({ recipes: state.recipes.filter((r) => r.id !== id) });
  },

  loadRecipe: (id) => {
    const state = get();
    const recipe = state.recipes.find((r) => r.id === id);
    if (!recipe) return;
    set({ beakerReagents: [], currentReaction: null, temperature: 20, isHeating: false, equationDisplay: '', phenomena: [], beakerColor: { r: 220, g: 235, b: 245, a: 0.2 } });
    for (const step of recipe.steps) {
      setTimeout(() => {
        get().addReagentToBeaker(step.reagentId, step.amount);
      }, step.id * 300);
    }
  },

  selectRecipe: (id) => set({ selectedRecipeId: id }),

  toggleTag: (tag) => {
    const state = get();
    const activeTags = state.activeTags.includes(tag)
      ? state.activeTags.filter((t) => t !== tag)
      : [...state.activeTags, tag];
    set({ activeTags });
  },

  openModal: (reagentId) => set({ modalReagentId: reagentId, modalOpen: true, modalClosing: false }),

  closeModal: () => {
    set({ modalClosing: true });
    setTimeout(() => {
      set({ modalOpen: false, modalClosing: false, modalReagentId: null });
    }, 300);
  },

  loadHistoryRecord: (record) => {
    set({
      beakerReagents: [],
      currentReaction: null,
      temperature: 20,
      isHeating: false,
      equationDisplay: '',
      phenomena: [],
      beakerColor: { r: 220, g: 235, b: 245, a: 0.2 },
    });
    for (let i = 0; i < record.beakerReagents.length; i++) {
      const step = record.beakerReagents[i];
      setTimeout(() => {
        get().addReagentToBeaker(step.reagentId, step.amount);
      }, (i + 1) * 300);
    }
  },

  updateRecipeNotes: (id, notes) => {
    const state = get();
    set({
      recipes: state.recipes.map((r) => (r.id === id ? { ...r, notes } : r)),
    });
  },
}));
