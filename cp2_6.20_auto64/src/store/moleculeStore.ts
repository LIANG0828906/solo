
import { create } from 'zustand';
import type { ElementType, BondType } from '../utils/constants';
import { ELEMENT_CONFIG } from '../utils/constants';
import type { PresetMolecule } from '../utils/moleculePresets';

export interface Atom {
  id: string;
  element: ElementType;
  position: [number, number, number];
  initialPosition?: [number, number, number];
  color: string;
  radius: number;
  selected: boolean;
  createdAt: number;
  animated: boolean;
}

export interface Bond {
  id: string;
  atomA: string;
  atomB: string;
  type: BondType;
  length: number;
  selected: boolean;
  createdAt: number;
  animated: boolean;
}

export interface Particle {
  id: string;
  position: [number, number, number];
  color: string;
  velocity: [number, number, number];
  createdAt: number;
  lifetime: number;
}

interface MoleculeState {
  atoms: Atom[];
  bonds: Bond[];
  particles: Particle[];
  selectedAtomId: string | null;
  selectedBondId: string | null;
  selectedBondType: BondType;
  draggingElement: ElementType | null;
  isOverScene: boolean;
  bondCreationFirstAtom: string | null;

  addAtom: (element: ElementType, position: [number, number, number], animated?: boolean) => string;
  removeAtom: (id: string) => void;
  selectAtom: (id: string | null) => void;
  selectBond: (id: string | null) => void;
  setSelectedBondType: (type: BondType) => void;
  addBond: (atomAId: string, atomBId: string, type: BondType) => void;
  setBondCreationFirstAtom: (id: string | null) => void;
  setDraggingElement: (el: ElementType | null) => void;
  setIsOverScene: (over: boolean) => void;
  addParticles: (position: [number, number, number], color: string) => void;
  updateParticles: () => void;
  clearAll: () => void;
  loadPreset: (preset: PresetMolecule) => void;
  getMolecularWeight: () => number;
  getAtomById: (id: string) => Atom | undefined;
}

const generateId = () => Math.random().toString(36).slice(2, 10);

const calculateDistance = (a: [number, number, number], b: [number, number, number]) => {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2)
  );
};

export const useMoleculeStore = create<MoleculeState>((set, get) => ({
  atoms: [],
  bonds: [],
  particles: [],
  selectedAtomId: null,
  selectedBondId: null,
  selectedBondType: 'single',
  draggingElement: null,
  isOverScene: false,
  bondCreationFirstAtom: null,

  addAtom: (element, position, animated = false) => {
    const id = generateId();
    const config = ELEMENT_CONFIG[element];
    set((state) => ({
      atoms: [
        ...state.atoms,
        {
          id,
          element,
          position,
          initialPosition: position,
          color: config.color,
          radius: config.radius,
          selected: false,
          createdAt: Date.now(),
          animated,
        },
      ],
    }));
    return id;
  },

  removeAtom: (id) => {
    set((state) => ({
      atoms: state.atoms.filter((a) => a.id !== id),
      bonds: state.bonds.filter((b) => b.atomA !== id && b.atomB !== id),
      selectedAtomId: state.selectedAtomId === id ? null : state.selectedAtomId,
    }));
  },

  selectAtom: (id) => {
    set((state) => ({
      selectedAtomId: id,
      selectedBondId: null,
      atoms: state.atoms.map((a) => ({ ...a, selected: a.id === id })),
      bonds: state.bonds.map((b) => ({ ...b, selected: false })),
    }));
  },

  selectBond: (id) => {
    set((state) => ({
      selectedBondId: id,
      selectedAtomId: null,
      atoms: state.atoms.map((a) => ({ ...a, selected: false })),
      bonds: state.bonds.map((b) => ({ ...b, selected: b.id === id })),
    }));
  },

  setSelectedBondType: (type) => {
    set({ selectedBondType: type, bondCreationFirstAtom: null });
  },

  addBond: (atomAId, atomBId, type) => {
    const state = get();
    const atomA = state.atoms.find((a) => a.id === atomAId);
    const atomB = state.atoms.find((a) => a.id === atomBId);
    if (!atomA || !atomB || atomAId === atomBId) return;

    const exists = state.bonds.some(
      (b) =>
        (b.atomA === atomAId && b.atomB === atomBId) ||
        (b.atomA === atomBId && b.atomB === atomAId)
    );
    if (exists) return;

    const length = calculateDistance(atomA.position, atomB.position);

    set((s) => ({
      bonds: [
        ...s.bonds,
        {
          id: generateId(),
          atomA: atomAId,
          atomB: atomBId,
          type,
          length,
          selected: false,
          createdAt: Date.now(),
          animated: true,
        },
      ],
      bondCreationFirstAtom: null,
    }));
  },

  setBondCreationFirstAtom: (id) => {
    set({ bondCreationFirstAtom: id });
  },

  setDraggingElement: (el) => {
    set({ draggingElement: el });
  },

  setIsOverScene: (over) => {
    set({ isOverScene: over });
  },

  addParticles: (position, color) => {
    const particleCount = 20;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 2.5 + Math.random() * 2.5;
      particles.push({
        id: generateId(),
        position: [...position] as [number, number, number],
        color,
        velocity: [
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
          Math.cos(phi) * speed,
        ],
        createdAt: Date.now(),
        lifetime: 500,
      });
    }
    set((state) => ({
      particles: [...state.particles, ...particles],
    }));
  },

  updateParticles: () => {
    const now = Date.now();
    set((state) => ({
      particles: state.particles
        .map((p) => {
          const elapsed = now - p.createdAt;
          const progress = Math.min(elapsed / p.lifetime, 1);
          const decay = 1 - progress * 0.9;
          return {
            ...p,
            position: [
              p.position[0] + p.velocity[0] * 0.016 * decay,
              p.position[1] + p.velocity[1] * 0.016 * decay,
              p.position[2] + p.velocity[2] * 0.016 * decay,
            ] as [number, number, number],
          };
        })
        .filter((p) => now - p.createdAt < p.lifetime),
    }));
  },

  clearAll: () => {
    set({
      atoms: [],
      bonds: [],
      particles: [],
      selectedAtomId: null,
      selectedBondId: null,
      bondCreationFirstAtom: null,
    });
  },

  loadPreset: (preset) => {
    const state = get();
    state.clearAll();

    setTimeout(() => {
      const atomIds: string[] = [];
      preset.atoms.forEach((atom, index) => {
        setTimeout(() => {
          const id = get().addAtom(atom.element, atom.position, true);
          atomIds[index] = id;
        }, index * 80);
      });

      setTimeout(() => {
        preset.bonds.forEach((bond, index) => {
          setTimeout(() => {
            const currentState = get();
            const aId = atomIds[bond.atomA];
            const bId = atomIds[bond.atomB];
            if (aId && bId) {
              currentState.addBond(aId, bId, bond.type);
            }
          }, index * 60);
        });
      }, preset.atoms.length * 80 + 100);
    }, 50);
  },

  getMolecularWeight: () => {
    const state = get();
    return state.atoms.reduce((sum, atom) => {
      return sum + ELEMENT_CONFIG[atom.element].atomicWeight;
    }, 0);
  },

  getAtomById: (id) => {
    return get().atoms.find((a) => a.id === id);
  },
}));
