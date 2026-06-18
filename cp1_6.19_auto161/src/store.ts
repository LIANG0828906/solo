import { eventBus } from './eventBus';
import React from 'react';

export interface BaseShape {
  id: string;
  type: 'pen' | 'rectangle' | 'circle' | 'sticky';
  color: string;
  strokeWidth: number;
  createdAt: number;
  createdBy: string;
}

export interface PenShape extends BaseShape {
  type: 'pen';
  points: { x: number; y: number }[];
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
}

export interface StickyNote extends BaseShape {
  type: 'sticky';
  x: number;
  y: number;
  text: string;
  bgColor: string;
  width: number;
  height: number;
}

export type Shape = PenShape | RectangleShape | CircleShape | StickyNote;

export interface User {
  id: string;
  name: string;
  avatarColor: string;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  type: 'text' | 'notification';
  userId: string;
  content: string;
  timestamp: number;
  shapeInfo?: {
    shapeType: string;
    color: string;
    x: number;
    y: number;
    shapeName: string;
  };
}

export interface ViewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface AppState {
  shapes: Shape[];
  users: User[];
  messages: ChatMessage[];
  sessionName: string;
  currentUserId: string;
  selectedTool: 'pen' | 'rectangle' | 'circle' | 'sticky' | 'select';
  selectedColor: string;
  strokeWidth: number;
  viewTransform: ViewTransform;
  selectedShapeId: string | null;
  history: Shape[][];
  historyIndex: number;
  maxHistory: number;
}

export interface AppActions {
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  setShapes: (shapes: Shape[]) => void;
  addMessage: (message: ChatMessage) => void;
  setSelectedTool: (tool: AppState['selectedTool']) => void;
  setSelectedColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setViewTransform: (transform: ViewTransform) => void;
  setSelectedShapeId: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  newSession: () => void;
}

export type Store = AppState & AppActions;

const MOCK_USERS: User[] = [
  { id: 'user-1', name: '张小明', avatarColor: '#E74C3C', isOnline: true },
  { id: 'user-2', name: '李小红', avatarColor: '#3498DB', isOnline: true },
  { id: 'user-3', name: '王小刚', avatarColor: '#2ECC71', isOnline: false },
];

const PRESET_COLORS = [
  '#E74C3C',
  '#3498DB',
  '#2ECC71',
  '#F1C40F',
  '#9B59B6',
  '#E67E22',
  '#1ABC9C',
  '#34495E',
];

export { MOCK_USERS, PRESET_COLORS };

let shapeIdCounter = 0;
let messageIdCounter = 0;

export const generateShapeId = (): string => {
  shapeIdCounter += 1;
  return `shape-${Date.now()}-${shapeIdCounter}`;
};

export const generateMessageId = (): string => {
  messageIdCounter += 1;
  return `msg-${Date.now()}-${messageIdCounter}`;
};

type Listener = () => void;

function createStore(): Store {
  let state: AppState = {
    shapes: [],
    users: MOCK_USERS,
    messages: [],
    sessionName: '急速头脑风暴-001',
    currentUserId: 'user-1',
    selectedTool: 'pen',
    selectedColor: PRESET_COLORS[0],
    strokeWidth: 3,
    viewTransform: { scale: 1, offsetX: 0, offsetY: 0 },
    selectedShapeId: null,
    history: [[]],
    historyIndex: 0,
    maxHistory: 20,
  };

  const listeners = new Set<Listener>();

  const notify = () => {
    listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Store listener error:', e);
      }
    });
  };

  const setState = (updates: Partial<AppState>) => {
    state = { ...state, ...updates };
    notify();
  };

  const saveHistory = () => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push([...state.shapes]);
    if (newHistory.length > state.maxHistory + 1) {
      newHistory.shift();
    }
    state = {
      ...state,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };
    notify();
  };

  const store: Store = {
    get shapes() { return state.shapes; },
    get users() { return state.users; },
    get messages() { return state.messages; },
    get sessionName() { return state.sessionName; },
    get currentUserId() { return state.currentUserId; },
    get selectedTool() { return state.selectedTool; },
    get selectedColor() { return state.selectedColor; },
    get strokeWidth() { return state.strokeWidth; },
    get viewTransform() { return state.viewTransform; },
    get selectedShapeId() { return state.selectedShapeId; },
    get history() { return state.history; },
    get historyIndex() { return state.historyIndex; },
    get maxHistory() { return state.maxHistory; },

    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    addShape(shape: Shape) {
      const newShapes = [...state.shapes, shape];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newShapes);
      if (newHistory.length > state.maxHistory + 1) {
        newHistory.shift();
      }
      state = {
        ...state,
        shapes: newShapes,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
      notify();
      eventBus.emit('shape:add', { shape });
    },

    updateShape(id: string, updates: Partial<Shape>) {
      const shape = state.shapes.find((s) => s.id === id);
      if (!shape) return;

      const wasMoved = 'x' in updates || 'y' in updates;
      const newShapes = state.shapes.map((s) =>
        s.id === id ? ({ ...s, ...updates } as Shape) : s
      );

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([...newShapes]);
      if (newHistory.length > state.maxHistory + 1) {
        newHistory.shift();
      }

      state = {
        ...state,
        shapes: newShapes,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
      notify();

      if (wasMoved) {
        const updatedShape = newShapes.find((s) => s.id === id);
        if (updatedShape) {
          eventBus.emit('shape:move', { shape: updatedShape });
        }
      }
    },

    deleteShape(id: string) {
      const shape = state.shapes.find((s) => s.id === id);
      const newShapes = state.shapes.filter((s) => s.id !== id);

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([...newShapes]);
      if (newHistory.length > state.maxHistory + 1) {
        newHistory.shift();
      }

      state = {
        ...state,
        shapes: newShapes,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
      notify();

      if (shape) {
        eventBus.emit('shape:delete', { shape });
      }
    },

    setShapes(shapes: Shape[]) {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([...shapes]);
      if (newHistory.length > state.maxHistory + 1) {
        newHistory.shift();
      }
      state = {
        ...state,
        shapes,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
      notify();
    },

    addMessage(message: ChatMessage) {
      state = {
        ...state,
        messages: [...state.messages, message],
      };
      notify();
    },

    setSelectedTool(tool) {
      setState({ selectedTool: tool });
    },

    setSelectedColor(color) {
      setState({ selectedColor: color });
    },

    setStrokeWidth(width) {
      setState({ strokeWidth: width });
    },

    setViewTransform(transform) {
      setState({ viewTransform: transform });
    },

    setSelectedShapeId(id) {
      setState({ selectedShapeId: id });
    },

    undo() {
      if (state.historyIndex <= 0) return;
      const newIndex = state.historyIndex - 1;
      const shapes = state.history[newIndex]
        ? [...state.history[newIndex]]
        : state.shapes;
      state = {
        ...state,
        shapes,
        historyIndex: newIndex,
      };
      notify();
    },

    redo() {
      if (state.historyIndex >= state.history.length - 1) return;
      const newIndex = state.historyIndex + 1;
      const shapes = state.history[newIndex]
        ? [...state.history[newIndex]]
        : state.shapes;
      state = {
        ...state,
        shapes,
        historyIndex: newIndex,
      };
      notify();
    },

    canUndo() {
      return state.historyIndex > 0;
    },

    canRedo() {
      return state.historyIndex < state.history.length - 1;
    },

    newSession() {
      state = {
        ...state,
        shapes: [],
        messages: [],
        history: [[]],
        historyIndex: 0,
        selectedShapeId: null,
        viewTransform: { scale: 1, offsetX: 0, offsetY: 0 },
      };
      notify();
      eventBus.emit('session:new', {});
    },
  };

  return store;
}

export const appStore = createStore();

export function useStore<T>(selector: (state: Store) => T): T {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    return appStore.subscribe(() => forceUpdate());
  }, []);

  return selector(appStore);
}
