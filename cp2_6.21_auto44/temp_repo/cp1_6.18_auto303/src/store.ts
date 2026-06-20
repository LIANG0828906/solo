import { create } from 'zustand';
import { parseCode, type ParseResult } from './utils/parser';
import { simulateQuantumState, type QuantumState } from './utils/quantumSim';

interface AppState {
  codeInput: string;
  parseResult: ParseResult | null;
  quantumState: QuantumState | null;
  selectedNodeId: string | null;
  interactionHistory: string[];
  setCodeInput: (code: string) => void;
  selectNode: (id: string | null) => void;
  addToHistory: (action: string) => void;
  resetView: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  codeInput: '',
  parseResult: null,
  quantumState: null,
  selectedNodeId: null,
  interactionHistory: [],

  setCodeInput: (code: string) => {
    const truncatedCode = code.slice(0, 500);
    const parseResult = parseCode(truncatedCode);
    const quantumState = simulateQuantumState(parseResult);
    
    set({
      codeInput: truncatedCode,
      parseResult,
      quantumState,
    });
  },

  selectNode: (id: string | null) => {
    const state = get();
    if (id) {
      const node = state.parseResult?.nodes.find(n => n.id === id);
      if (node) {
        state.addToHistory(`Selected node: ${node.name} (${node.type})`);
      }
    }
    set({ selectedNodeId: id });
  },

  addToHistory: (action: string) => {
    set((state) => ({
      interactionHistory: [...state.interactionHistory.slice(-19), action],
    }));
  },

  resetView: () => {
    set({ selectedNodeId: null });
    get().addToHistory('Reset view');
  },
}));
