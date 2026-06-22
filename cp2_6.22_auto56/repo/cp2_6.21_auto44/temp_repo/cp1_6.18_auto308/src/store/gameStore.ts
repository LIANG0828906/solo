import { create } from 'zustand';
import type { Command } from '../game/levelConfig';
import { CommandType } from '../game/levelConfig';

interface GameState {
  commands: Command[];
  functionDef: Command | null;
  isRunning: boolean;
  activeCommandId: string | null;
  errorMessage: string | null;
  showRecursionError: boolean;

  addCommand: (cmd: Command) => void;
  removeCommand: (id: string) => void;
  moveCommand: (fromIndex: number, toIndex: number) => void;
  setFunctionDef: (cmd: Command | null) => void;
  setRunning: (v: boolean) => void;
  setActiveCommandId: (id: string | null) => void;
  setErrorMessage: (msg: string | null) => void;
  setShowRecursionError: (v: boolean) => void;
  reset: () => void;
}

let cmdIdCounter = 0;
export function createCommandId(): string {
  return `cmd_${++cmdIdCounter}_${Date.now()}`;
}

export function createDefaultCommand(type: CommandType): Command {
  const id = createCommandId();
  switch (type) {
    case CommandType.Loop:
      return { id, type, children: [], loopCount: 3 };
    case CommandType.FunctionDef:
      return { id, type, children: [] };
    default:
      return { id, type };
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  commands: [],
  functionDef: null,
  isRunning: false,
  activeCommandId: null,
  errorMessage: null,
  showRecursionError: false,

  addCommand: (cmd) =>
    set((s) => {
      if (s.commands.length >= 30) return s;
      return { commands: [...s.commands, cmd] };
    }),

  removeCommand: (id) =>
    set((s) => ({
      commands: s.commands.filter((c) => c.id !== id),
    })),

  moveCommand: (fromIndex, toIndex) =>
    set((s) => {
      const arr = [...s.commands];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return { commands: arr };
    }),

  setFunctionDef: (cmd) => set({ functionDef: cmd }),

  setRunning: (v) => set({ isRunning: v }),

  setActiveCommandId: (id) => set({ activeCommandId: id }),

  setErrorMessage: (msg) => set({ errorMessage: msg }),

  setShowRecursionError: (v) => set({ showRecursionError: v }),

  reset: () =>
    set({
      commands: [],
      functionDef: null,
      isRunning: false,
      activeCommandId: null,
      errorMessage: null,
      showRecursionError: false,
    }),
}));
