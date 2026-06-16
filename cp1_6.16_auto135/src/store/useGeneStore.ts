import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  GeneticElement,
  Connection,
  HistorySnapshot,
  SimulationState,
  SimulationResult,
  RemoteCursor,
  ElementType,
  ELEMENT_PRESETS,
  Position,
  CURSOR_COLORS
} from '@/models/GeneticElement';

interface GeneStore {
  elements: GeneticElement[];
  connections: Connection[];
  history: HistorySnapshot[];
  selectedElementId: string | null;
  draggingElement: GeneticElement | null;
  isDraggingNew: boolean;
  connectionStartId: string | null;
  tempConnectionEnd: Position | null;
  simulation: SimulationState;
  remoteCursors: RemoteCursor[];
  currentUserId: string;
  socketConnected: boolean;
  isTransitioning: boolean;

  addElement: (type: ElementType, position: Position) => void;
  moveElement: (id: string, position: Position) => void;
  removeElement: (id: string) => void;
  setSelectedElement: (id: string | null) => void;
  setDraggingElement: (element: GeneticElement | null, isNew: boolean) => void;

  startConnection: (fromId: string) => void;
  updateTempConnection: (position: Position | null) => void;
  finishConnection: (toId: string) => void;
  cancelConnection: () => void;
  removeConnection: (id: string) => void;

  saveSnapshot: (result?: SimulationResult) => void;
  restoreSnapshot: (snapshotId: string) => void;
  clearHistory: () => void;

  playSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  updateSimulation: (partial: Partial<SimulationState>) => void;
  setSimulationResult: (result: SimulationResult) => void;

  setSocketConnected: (connected: boolean) => void;
  addRemoteCursor: (userId: string, userName: string) => void;
  updateRemoteCursor: (userId: string, position: Position) => void;
  removeRemoteCursor: (userId: string) => void;
  syncFromRemote: (elements: GeneticElement[], connections: Connection[]) => void;
}

const initialSimulation: SimulationState = {
  isPlaying: false,
  currentStep: 0,
  totalSteps: 0,
  status: 'idle',
  polymerasePosition: null,
  mrnaGenerated: false,
  blockedByRepressor: false,
  pairedResult: null
};

export const useGeneStore = create<GeneStore>((set, get) => ({
  elements: [],
  connections: [],
  history: [],
  selectedElementId: null,
  draggingElement: null,
  isDraggingNew: false,
  connectionStartId: null,
  tempConnectionEnd: null,
  simulation: initialSimulation,
  remoteCursors: [],
  currentUserId: uuidv4(),
  socketConnected: false,
  isTransitioning: false,

  addElement: (type, position) => {
    const preset = ELEMENT_PRESETS[type];
    const newElement: GeneticElement = {
      id: uuidv4(),
      ...preset,
      position: { ...position }
    };
    set((state) => ({ elements: [...state.elements, newElement] }));
  },

  moveElement: (id, position) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, position: { ...position } } : el
      )
    }));
  },

  removeElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      connections: state.connections.filter(
        (conn) => conn.fromId !== id && conn.toId !== id
      ),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
    }));
  },

  setSelectedElement: (id) => set({ selectedElementId: id }),

  setDraggingElement: (element, isNew) => set({
    draggingElement: element,
    isDraggingNew: isNew
  }),

  startConnection: (fromId) => set({ connectionStartId: fromId }),

  updateTempConnection: (position) => set({ tempConnectionEnd: position }),

  finishConnection: (toId) => {
    const state = get();
    if (!state.connectionStartId || state.connectionStartId === toId) {
      set({ connectionStartId: null, tempConnectionEnd: null });
      return;
    }
    const fromElement = state.elements.find((el) => el.id === state.connectionStartId);
    if (!fromElement) {
      set({ connectionStartId: null, tempConnectionEnd: null });
      return;
    }
    const exists = state.connections.some(
      (c) => c.fromId === state.connectionStartId && c.toId === toId
    );
    if (exists) {
      set({ connectionStartId: null, tempConnectionEnd: null });
      return;
    }
    const newConnection: Connection = {
      id: uuidv4(),
      fromId: state.connectionStartId,
      toId,
      color: fromElement.color
    };
    set((s) => ({
      connections: [...s.connections, newConnection],
      connectionStartId: null,
      tempConnectionEnd: null
    }));
  },

  cancelConnection: () => set({
    connectionStartId: null,
    tempConnectionEnd: null
  }),

  removeConnection: (id) => {
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id)
    }));
  },

  saveSnapshot: (result) => {
    const state = get();
    const snapshot: HistorySnapshot = {
      id: uuidv4(),
      timestamp: Date.now(),
      elements: JSON.parse(JSON.stringify(state.elements)),
      connections: JSON.parse(JSON.stringify(state.connections)),
      result
    };
    set((s) => ({
      history: [snapshot, ...s.history].slice(0, 1000)
    }));
  },

  restoreSnapshot: (snapshotId) => {
    const state = get();
    const snapshot = state.history.find((h) => h.id === snapshotId);
    if (!snapshot) return;
    set({ isTransitioning: true });
    setTimeout(() => {
      set({
        elements: JSON.parse(JSON.stringify(snapshot.elements)),
        connections: JSON.parse(JSON.stringify(snapshot.connections)),
        simulation: initialSimulation,
        isTransitioning: false
      });
    }, 300);
  },

  clearHistory: () => set({ history: [] }),

  playSimulation: () => set((state) => ({
    simulation: { ...state.simulation, isPlaying: true, status: 'running' }
  })),

  pauseSimulation: () => set((state) => ({
    simulation: { ...state.simulation, isPlaying: false }
  })),

  resetSimulation: () => set({ simulation: initialSimulation }),

  updateSimulation: (partial) => set((state) => ({
    simulation: { ...state.simulation, ...partial }
  })),

  setSimulationResult: () => {},

  setSocketConnected: (connected) => set({ socketConnected: connected }),

  addRemoteCursor: (userId, userName) => {
    const state = get();
    const existing = state.remoteCursors.find((c) => c.userId === userId);
    if (existing) return;
    const colorIdx = state.remoteCursors.length % CURSOR_COLORS.length;
    set((s) => ({
      remoteCursors: [
        ...s.remoteCursors,
        {
          userId,
          userName,
          color: CURSOR_COLORS[colorIdx],
          position: { x: 0, y: 0 }
        }
      ]
    }));
  },

  updateRemoteCursor: (userId, position) => {
    set((state) => ({
      remoteCursors: state.remoteCursors.map((c) =>
        c.userId === userId ? { ...c, position: { ...position } } : c
      )
    }));
  },

  removeRemoteCursor: (userId) => {
    set((state) => ({
      remoteCursors: state.remoteCursors.filter((c) => c.userId !== userId)
    }));
  },

  syncFromRemote: (elements, connections) => set({ elements, connections })
}));
