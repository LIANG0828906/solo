import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  WhiteboardElement,
  ToolType,
  Collaborator,
  HistorySnapshot,
  ReplayState,
  USER_COLORS,
  DEFAULT_ROOM_ID,
  MAX_HISTORY_DEPTH,
  REPLAY_STEP_INTERVAL,
} from '@types/index';

const RANDOM_NAMES = [
  '创意猫',
  '灵感星',
  '设计侠',
  '绘画王',
  '想象狮',
  '思维蜂',
  '艺术兔',
  '创新鹰',
];

function generateRandomName(): string {
  return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
}

function assignColor(existingColors: string[]): string {
  const used = new Set(existingColors);
  const available = USER_COLORS.filter((c) => !used.has(c));
  if (available.length > 0) {
    return available[0];
  }
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

interface ElementStoreState {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserColor: string;

  tool: ToolType;
  brushWidth: number;
  borderRadius: number;
  polygonSides: number;

  elements: WhiteboardElement[];
  collaborators: Collaborator[];

  historyStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
  historyIndex: number;

  replay: ReplayState;
  lastOperationTime: number | null;

  selectedElementId: string | null;
}

interface ElementStoreActions {
  setTool: (tool: ToolType) => void;
  setBrushWidth: (w: number) => void;
  setBorderRadius: (r: number) => void;
  setPolygonSides: (n: number) => void;

  setRoom: (roomId: string) => void;

  addElement: (el: WhiteboardElement) => void;
  updateElement: (id: string, patch: Partial<WhiteboardElement>) => void;
  deleteElement: (id: string) => void;
  setElements: (elements: WhiteboardElement[]) => void;

  addCollaborator: (c?: Partial<Collaborator>) => Collaborator;
  removeCollaborator: (id: string) => void;
  updateCollaboratorCursor: (id: string, x: number, y: number) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: (elements?: WhiteboardElement[]) => void;

  startReplay: () => void;
  stopReplay: () => void;
  stepReplay: () => void;

  setSelectedElementId: (id: string | null) => void;
  setLastOperationTime: (t: number) => void;
}

export type ElementStore = ElementStoreState & ElementStoreActions;

const initialUserId = uuidv4();
const initialUserName = generateRandomName();
const initialUserColor = USER_COLORS[0];

const initialCollaborator: Collaborator = {
  id: initialUserId,
  name: initialUserName,
  color: initialUserColor,
  cursorX: 0,
  cursorY: 0,
  lastActive: Date.now(),
  isLocal: true,
};

const initialState: ElementStoreState = {
  roomId: DEFAULT_ROOM_ID,
  currentUserId: initialUserId,
  currentUserName: initialUserName,
  currentUserColor: initialUserColor,

  tool: 'brush',
  brushWidth: 4,
  borderRadius: 8,
  polygonSides: 5,

  elements: [],
  collaborators: [initialCollaborator],

  historyStack: [{ elements: [], timestamp: Date.now() }],
  redoStack: [],
  historyIndex: 0,

  replay: {
    isPlaying: false,
    currentStep: 0,
    totalSteps: 0,
    highlightedElementId: null,
  },
  lastOperationTime: null,

  selectedElementId: null,
};

export const useElementStore = create<ElementStore>((set, get) => ({
  ...initialState,

  setTool: (tool) => set({ tool }),
  setBrushWidth: (w) => set({ brushWidth: Math.max(2, Math.min(8, w)) }),
  setBorderRadius: (r) => set({ borderRadius: Math.max(0, Math.min(20, r)) }),
  setPolygonSides: (n) => set({ polygonSides: Math.max(3, Math.min(8, n)) }),

  setRoom: (roomId) => {
    set({
      roomId,
      elements: [],
      historyStack: [{ elements: [], timestamp: Date.now() }],
      redoStack: [],
      historyIndex: 0,
    });
  },

  addElement: (el) => {
    const state = get();
    const elements = [...state.elements, el];
    set({ elements, lastOperationTime: Date.now() });
    get().pushHistory(elements);
  },

  updateElement: (id, patch) => {
    const state = get();
    const elements = state.elements.map((e) =>
      e.id === id
        ? ({ ...e, ...patch, updatedAt: Date.now() } as WhiteboardElement)
        : e,
    );
    set({ elements, lastOperationTime: Date.now() });
    get().pushHistory(elements);
  },

  deleteElement: (id) => {
    const state = get();
    const elements = state.elements.filter((e) => e.id !== id);
    set({ elements, lastOperationTime: Date.now(), selectedElementId: null });
    get().pushHistory(elements);
  },

  setElements: (elements) => {
    set({ elements, lastOperationTime: Date.now() });
  },

  addCollaborator: (c) => {
    const state = get();
    const existingColors = state.collaborators.map((col) => col.color);
    const newCollab: Collaborator = {
      id: c?.id || uuidv4(),
      name: c?.name || generateRandomName(),
      color: c?.color || assignColor(existingColors),
      cursorX: c?.cursorX || 0,
      cursorY: c?.cursorY || 0,
      lastActive: Date.now(),
      isLocal: c?.isLocal || false,
    };
    set({ collaborators: [...state.collaborators, newCollab] });
    return newCollab;
  },

  removeCollaborator: (id) => {
    const state = get();
    set({
      collaborators: state.collaborators.filter((c) => c.id !== id),
    });
  },

  updateCollaboratorCursor: (id, x, y) => {
    const state = get();
    const cols = state.collaborators.map((c) =>
      c.id === id
        ? { ...c, cursorX: x, cursorY: y, lastActive: Date.now() }
        : c,
    );
    set({ collaborators: cols });
  },

  pushHistory: (elements) => {
    const state = get();
    if (state.replay.isPlaying) return;

    const currentElements = elements || state.elements;
    const snapshot: HistorySnapshot = {
      elements: currentElements.map((e) => ({ ...e })) as WhiteboardElement[],
      timestamp: Date.now(),
    };

    const trimmedStack =
      state.historyIndex < state.historyStack.length - 1
        ? state.historyStack.slice(0, state.historyIndex + 1)
        : state.historyStack;

    let newStack = [...trimmedStack, snapshot];
    if (newStack.length > MAX_HISTORY_DEPTH) {
      newStack = newStack.slice(newStack.length - MAX_HISTORY_DEPTH);
    }

    set({
      historyStack: newStack,
      historyIndex: newStack.length - 1,
      redoStack: [],
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return;

    const newIndex = state.historyIndex - 1;
    const snapshot = state.historyStack[newIndex];
    const currentSnapshot = state.historyStack[state.historyIndex];

    set({
      historyIndex: newIndex,
      elements: snapshot.elements.map((e) => ({ ...e })) as WhiteboardElement[],
      redoStack: [...state.redoStack, currentSnapshot],
      lastOperationTime: Date.now(),
    });
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;

    const snapshot = state.redoStack[state.redoStack.length - 1];
    const newRedoStack = state.redoStack.slice(0, -1);

    set({
      historyIndex: state.historyIndex + 1,
      elements: snapshot.elements.map((e) => ({ ...e })) as WhiteboardElement[],
      redoStack: newRedoStack,
      lastOperationTime: Date.now(),
    });
  },

  startReplay: () => {
    const state = get();
    const totalSteps = state.historyStack.length - 1;
    if (totalSteps <= 0) return;

    set({
      replay: {
        isPlaying: true,
        currentStep: 0,
        totalSteps,
        highlightedElementId: null,
      },
      elements: [],
      historyIndex: 0,
    });

    get().stepReplay();
  },

  stopReplay: () => {
    const state = get();
    const finalSnapshot = state.historyStack[state.historyStack.length - 1];
    set({
      replay: {
        isPlaying: false,
        currentStep: 0,
        totalSteps: 0,
        highlightedElementId: null,
      },
      elements: finalSnapshot.elements.map((e) => ({ ...e })) as WhiteboardElement[],
      historyIndex: state.historyStack.length - 1,
    });
  },

  stepReplay: () => {
    const state = get();
    if (!state.replay.isPlaying) return;

    const nextStep = state.replay.currentStep + 1;
    if (nextStep > state.replay.totalSteps) {
      get().stopReplay();
      return;
    }

    const snapshot = state.historyStack[nextStep];
    const prevSnapshot = state.historyStack[nextStep - 1];
    const newElements = snapshot.elements;
    const highlightedId =
      newElements.length > prevSnapshot.elements.length
        ? newElements[newElements.length - 1].id
        : null;

    set({
      elements: newElements.map((e) => ({ ...e })) as WhiteboardElement[],
      replay: {
        ...state.replay,
        currentStep: nextStep,
        highlightedElementId: highlightedId,
      },
      historyIndex: nextStep,
    });

    setTimeout(() => {
      get().stepReplay();
    }, REPLAY_STEP_INTERVAL);
  },

  setSelectedElementId: (id) => set({ selectedElementId: id }),
  setLastOperationTime: (t) => set({ lastOperationTime: t }),
}));
