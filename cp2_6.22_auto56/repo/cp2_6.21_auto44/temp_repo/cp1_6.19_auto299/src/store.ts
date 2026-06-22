import { create } from 'zustand';
import { CAFFEINE_ATOMS, CAFFEINE_BONDS, AtomData, BondData } from './data/molecule';

export interface Atom {
  id: string;
  element: 'C' | 'O' | 'N' | 'H';
  originalPosition: [number, number, number];
  currentPosition: [number, number, number];
  disassembledPosition: [number, number, number];
  role: string;
  isAssembled: boolean;
  animationProgress: number;
}

export interface Bond {
  id: string;
  atom1Id: string;
  atom2Id: string;
}

interface HistoryEntry {
  atoms: Atom[];
  isDisassembled: boolean;
  timestamp: number;
}

interface MoleculeState {
  atoms: Atom[];
  bonds: Bond[];
  selectedAtomId: string | null;
  hoveredAtomId: string | null;
  isDisassembled: boolean;
  history: HistoryEntry[];
  cameraResetKey: number;

  disassembleAll: () => void;
  assembleAll: () => void;
  assembleAtom: (atomId: string) => void;
  setHoveredAtom: (atomId: string | null) => void;
  setSelectedAtom: (atomId: string | null) => void;
  undo: () => void;
  resetCamera: () => void;
  updateAtomAnimation: (atomId: string, progress: number) => void;
  setAtomPosition: (atomId: string, position: [number, number, number]) => void;
  setAtomAssembled: (atomId: string, assembled: boolean) => void;
}

const createInitialAtoms = (): Atom[] => {
  return CAFFEINE_ATOMS.map((atom: AtomData) => {
    const [x, y, z] = atom.position;
    const distance = Math.sqrt(x * x + y * y + z * z) || 1;
    const factor = 2.5;
    return {
      id: atom.id,
      element: atom.element,
      originalPosition: atom.position,
      currentPosition: atom.position,
      disassembledPosition: [
        x * factor + (x / distance) * 0.5,
        y * factor + (y / distance) * 0.5,
        z * factor + (z / distance) * 0.5,
      ] as [number, number, number],
      role: atom.role,
      isAssembled: true,
      animationProgress: 0,
    };
  });
};

const createInitialBonds = (): Bond[] => {
  return CAFFEINE_BONDS.map((bond: BondData) => ({
    id: bond.id,
    atom1Id: bond.atom1Id,
    atom2Id: bond.atom2Id,
  }));
};

const cloneAtoms = (atoms: Atom[]): Atom[] => {
  return atoms.map((atom) => ({
    ...atom,
    originalPosition: [...atom.originalPosition] as [number, number, number],
    currentPosition: [...atom.currentPosition] as [number, number, number],
    disassembledPosition: [...atom.disassembledPosition] as [number, number, number],
  }));
};

const MAX_HISTORY = 20;

export const useMoleculeStore = create<MoleculeState>((set, get) => ({
  atoms: createInitialAtoms(),
  bonds: createInitialBonds(),
  selectedAtomId: null,
  hoveredAtomId: null,
  isDisassembled: false,
  history: [],
  cameraResetKey: 0,

  disassembleAll: () => {
    const { atoms, isDisassembled, history } = get();
    if (isDisassembled) return;

    const newHistory = [
      ...history,
      { atoms: cloneAtoms(atoms), isDisassembled, timestamp: Date.now() },
    ].slice(-MAX_HISTORY);

    const newAtoms = cloneAtoms(atoms).map((atom) => ({
      ...atom,
      isAssembled: false,
      animationProgress: 0,
    }));

    set({ atoms: newAtoms, isDisassembled: true, history: newHistory });
  },

  assembleAll: () => {
    const { atoms, isDisassembled, history } = get();
    if (!isDisassembled) return;

    const newHistory = [
      ...history,
      { atoms: cloneAtoms(atoms), isDisassembled, timestamp: Date.now() },
    ].slice(-MAX_HISTORY);

    const newAtoms = cloneAtoms(atoms).map((atom) => ({
      ...atom,
      isAssembled: true,
      animationProgress: 0,
    }));

    set({ atoms: newAtoms, isDisassembled: false, history: newHistory });
  },

  assembleAtom: (atomId: string) => {
    const { atoms, isDisassembled, history } = get();
    const atom = atoms.find((a) => a.id === atomId);
    if (!atom || atom.isAssembled) return;

    const newHistory = [
      ...history,
      { atoms: cloneAtoms(atoms), isDisassembled, timestamp: Date.now() },
    ].slice(-MAX_HISTORY);

    const newAtoms = cloneAtoms(atoms).map((a) =>
      a.id === atomId ? { ...a, isAssembled: true, animationProgress: 0 } : a
    );

    const allAssembled = newAtoms.every((a) => a.isAssembled);

    set({ atoms: newAtoms, isDisassembled: !allAssembled, history: newHistory });
  },

  setHoveredAtom: (atomId: string | null) => {
    set({ hoveredAtomId: atomId });
  },

  setSelectedAtom: (atomId: string | null) => {
    set({ selectedAtomId: atomId });
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return;

    const newHistory = [...history];
    const lastState = newHistory.pop()!;

    set({
      atoms: cloneAtoms(lastState.atoms),
      isDisassembled: lastState.isDisassembled,
      history: newHistory,
    });
  },

  resetCamera: () => {
    set((state) => ({ cameraResetKey: state.cameraResetKey + 1 }));
  },

  updateAtomAnimation: (atomId: string, progress: number) => {
    set((state) => ({
      atoms: state.atoms.map((atom) =>
        atom.id === atomId ? { ...atom, animationProgress: progress } : atom
      ),
    }));
  },

  setAtomPosition: (atomId: string, position: [number, number, number]) => {
    set((state) => ({
      atoms: state.atoms.map((atom) =>
        atom.id === atomId ? { ...atom, currentPosition: position } : atom
      ),
    }));
  },

  setAtomAssembled: (atomId: string, assembled: boolean) => {
    set((state) => ({
      atoms: state.atoms.map((atom) =>
        atom.id === atomId ? { ...atom, isAssembled: assembled } : atom
      ),
    }));
  },
}));
