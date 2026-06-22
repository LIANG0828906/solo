import { create } from 'zustand';
import {
  Atom,
  Bond,
  BondOrder,
  EditMode,
  ElementType,
  Molecule,
  Vec3,
  MoleculeEngine,
  ProximityAlert,
} from '../modules/MoleculeEngine';
import { ReactionResult, ReactionSimulator } from '../modules/ReactionSimulator';

const moleculeEngine = new MoleculeEngine();
const reactionSimulator = new ReactionSimulator();

export interface PresetMolecule {
  id: string;
  name: string;
  build: (engine: MoleculeEngine) => void;
}

export const PRESET_MOLECULES: PresetMolecule[] = [
  {
    id: 'ethane',
    name: '乙烷 (C2H6)',
    build: (engine) => {
      const c1 = engine.addAtom('C', { x: -0.77, y: 0, z: 0 });
      const c2 = engine.addAtom('C', { x: 0.77, y: 0, z: 0 });
      engine.addBond(c1, c2, 1);
      engine.addAtom('H', { x: -1.35, y: 0.9, z: 0 });
      engine.addAtom('H', { x: -1.35, y: -0.9, z: 0 });
      engine.addAtom('H', { x: -1.15, y: 0, z: 0.9 });
      engine.addAtom('H', { x: 1.35, y: 0.9, z: 0 });
      engine.addAtom('H', { x: 1.35, y: -0.9, z: 0 });
      engine.addAtom('H', { x: 1.15, y: 0, z: -0.9 });
    },
  },
  {
    id: 'ethene',
    name: '乙烯 (C2H4)',
    build: (engine) => {
      const c1 = engine.addAtom('C', { x: -0.67, y: 0, z: 0 });
      const c2 = engine.addAtom('C', { x: 0.67, y: 0, z: 0 });
      engine.addBond(c1, c2, 2);
      engine.addAtom('H', { x: -1.25, y: 0.9, z: 0 });
      engine.addAtom('H', { x: -1.25, y: -0.9, z: 0 });
      engine.addAtom('H', { x: 1.25, y: 0.9, z: 0 });
      engine.addAtom('H', { x: 1.25, y: -0.9, z: 0 });
    },
  },
  {
    id: 'water',
    name: '水 (H2O)',
    build: (engine) => {
      const o = engine.addAtom('O', { x: 0, y: 0, z: 0 });
      const h1 = engine.addAtom('H', { x: 0.76, y: 0.59, z: 0 });
      const h2 = engine.addAtom('H', { x: -0.76, y: 0.59, z: 0 });
      engine.addBond(o, h1, 1);
      engine.addBond(o, h2, 1);
    },
  },
  {
    id: 'methane',
    name: '甲烷 (CH4)',
    build: (engine) => {
      const c = engine.addAtom('C', { x: 0, y: 0, z: 0 });
      const h1 = engine.addAtom('H', { x: 0.63, y: 0.63, z: 0.63 });
      const h2 = engine.addAtom('H', { x: -0.63, y: -0.63, z: 0.63 });
      const h3 = engine.addAtom('H', { x: -0.63, y: 0.63, z: -0.63 });
      const h4 = engine.addAtom('H', { x: 0.63, y: -0.63, z: -0.63 });
      engine.addBond(c, h1, 1);
      engine.addBond(c, h2, 1);
      engine.addBond(c, h3, 1);
      engine.addBond(c, h4, 1);
    },
  },
  {
    id: 'ammonia',
    name: '氨 (NH3)',
    build: (engine) => {
      const n = engine.addAtom('N', { x: 0, y: 0, z: 0 });
      const h1 = engine.addAtom('H', { x: 0.94, y: 0, z: 0 });
      const h2 = engine.addAtom('H', { x: -0.47, y: 0.81, z: 0 });
      const h3 = engine.addAtom('H', { x: -0.47, y: -0.81, z: 0 });
      engine.addBond(n, h1, 1);
      engine.addBond(n, h2, 1);
      engine.addBond(n, h3, 1);
    },
  },
];

interface MoleculeState {
  atoms: Atom[];
  bonds: Bond[];
  selectedAtomId: string | null;
  selectedBondId: string | null;
  editMode: EditMode;
  currentElement: ElementType;
  currentBondOrder: BondOrder;
  bondCreationFirstAtom: string | null;
  reactionResult: ReactionResult | null;
  animationProgress: number;
  animationPlaying: boolean;
  animationSpeed: number;
  reactantAId: string;
  reactantBId: string;
  toastMessage: string | null;
  proximityAlert: ProximityAlert | null;

  addAtom: (element: ElementType, position: Vec3) => void;
  removeAtom: (id: string) => void;
  updateAtomPosition: (id: string, position: Vec3) => void;
  selectAtom: (id: string | null) => void;
  selectBond: (id: string | null) => void;
  setEditMode: (mode: EditMode) => void;
  setCurrentElement: (element: ElementType) => void;
  setCurrentBondOrder: (order: BondOrder) => void;
  startBondCreation: (atomId: string) => void;
  cancelBondCreation: () => void;
  removeBond: (id: string) => void;
  loadPreset: (presetId: string) => void;
  loadPresetAsReactant: (presetId: string, slot: 'A' | 'B') => void;
  simulateReaction: () => void;
  setAnimationProgress: (progress: number) => void;
  setAnimationPlaying: (playing: boolean) => void;
  setAnimationSpeed: (speed: number) => void;
  getMoleculeEngine: () => MoleculeEngine;
  getReactionSimulator: () => ReactionSimulator;
  getCurrentMolecule: () => Molecule;
  showToast: (msg: string) => void;
  clearToast: () => void;
  clearProximityAlert: () => void;
  confirmBondCreation: (nearbyAtomId: string) => void;
}

function syncFromEngine(set: (state: Partial<MoleculeState>) => void): void {
  set({
    atoms: moleculeEngine.getAtoms(),
    bonds: moleculeEngine.getBonds(),
  });
}

export const useMoleculeStore = create<MoleculeState>((set, get) => {
  moleculeEngine.setProximityCallback((alert) => {
    set({ proximityAlert: alert });
  });

  return {
  atoms: moleculeEngine.getAtoms(),
  bonds: moleculeEngine.getBonds(),
  selectedAtomId: null,
  selectedBondId: null,
  editMode: 'select',
  currentElement: 'C',
  currentBondOrder: 1,
  bondCreationFirstAtom: null,
  reactionResult: null,
  animationProgress: 0,
  animationPlaying: false,
  animationSpeed: 1,
  reactantAId: 'ethane',
  reactantBId: 'ethene',
  toastMessage: null,
  proximityAlert: null,

  addAtom: (element: ElementType, position: Vec3) => {
    const id = moleculeEngine.addAtom(element, position);
    const near = moleculeEngine.getAtomsNear(position, 2.0).filter((a) => a.id !== id);
    if (near.length > 0) {
      get().showToast(`检测到附近有 ${near.length} 个原子，可创建化学键`);
    }
    syncFromEngine(set);
  },

  removeAtom: (id: string) => {
    moleculeEngine.removeAtom(id);
    if (get().selectedAtomId === id) {
      set({ selectedAtomId: null });
    }
    syncFromEngine(set);
  },

  updateAtomPosition: (id: string, position: Vec3) => {
    moleculeEngine.updateAtomPosition(id, position);
    syncFromEngine(set);
  },

  selectAtom: (id: string | null) => {
    set({ selectedAtomId: id, selectedBondId: null });
    const state = get();
    if (state.editMode === 'bond' && id !== null) {
      if (state.bondCreationFirstAtom === null) {
        set({ bondCreationFirstAtom: id });
      } else if (state.bondCreationFirstAtom !== id) {
        const result = moleculeEngine.addBond(
          state.bondCreationFirstAtom,
          id,
          state.currentBondOrder
        );
        if (result) {
          get().showToast('化学键创建成功');
        }
        set({ bondCreationFirstAtom: null });
        syncFromEngine(set);
      } else {
        set({ bondCreationFirstAtom: null });
      }
    }
  },

  selectBond: (id: string | null) => {
    set({ selectedBondId: id, selectedAtomId: null });
  },

  setEditMode: (mode: EditMode) => {
    set({ editMode: mode, bondCreationFirstAtom: null });
  },

  setCurrentElement: (element: ElementType) => {
    set({ currentElement: element, editMode: 'atom' });
  },

  setCurrentBondOrder: (order: BondOrder) => {
    set({ currentBondOrder: order, editMode: 'bond' });
  },

  startBondCreation: (atomId: string) => {
    set({ bondCreationFirstAtom: atomId });
  },

  cancelBondCreation: () => {
    set({ bondCreationFirstAtom: null });
  },

  removeBond: (id: string) => {
    moleculeEngine.removeBond(id);
    if (get().selectedBondId === id) {
      set({ selectedBondId: null });
    }
    syncFromEngine(set);
  },

  loadPreset: (presetId: string) => {
    const preset = PRESET_MOLECULES.find((p) => p.id === presetId);
    if (preset) {
      moleculeEngine.clear();
      preset.build(moleculeEngine);
      syncFromEngine(set);
      get().showToast(`已加载 ${preset.name}`);
    }
  },

  loadPresetAsReactant: (presetId: string, slot: 'A' | 'B') => {
    if (slot === 'A') {
      set({ reactantAId: presetId });
    } else {
      set({ reactantBId: presetId });
    }
  },

  simulateReaction: () => {
    const state = get();
    const presetA = PRESET_MOLECULES.find((p) => p.id === state.reactantAId);
    const presetB = PRESET_MOLECULES.find((p) => p.id === state.reactantBId);
    if (!presetA || !presetB) return;

    const engineA = new MoleculeEngine();
    engineA.clear();
    presetA.build(engineA);
    const engineB = new MoleculeEngine();
    engineB.clear();
    presetB.build(engineB);

    const molA = engineA.getMolecule(presetA.name);
    const molB = engineB.getMolecule(presetB.name);

    const result = reactionSimulator.simulate(molA, molB);
    set({
      reactionResult: result,
      animationProgress: 0,
      animationPlaying: false,
    });
    get().showToast('反应模拟完成！');
  },

  setAnimationProgress: (progress: number) => {
    set({ animationProgress: Math.max(0, Math.min(1, progress)) });
  },

  setAnimationPlaying: (playing: boolean) => {
    set({ animationPlaying: playing });
  },

  setAnimationSpeed: (speed: number) => {
    set({ animationSpeed: Math.max(0.25, Math.min(4, speed)) });
  },

  getMoleculeEngine: () => moleculeEngine,
  getReactionSimulator: () => reactionSimulator,

  getCurrentMolecule: () => moleculeEngine.getMolecule('current'),

  showToast: (msg: string) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 2500);
  },

  clearToast: () => set({ toastMessage: null }),

  clearProximityAlert: () => set({ proximityAlert: null }),

  confirmBondCreation: (nearbyAtomId: string) => {
    const state = get();
    if (!state.proximityAlert) return;
    const newAtomId = state.proximityAlert.atomId;
    if (newAtomId && nearbyAtomId && newAtomId !== nearbyAtomId) {
      const result = moleculeEngine.addBond(newAtomId, nearbyAtomId, state.currentBondOrder);
      if (result) {
        get().showToast('化学键创建成功');
      }
      syncFromEngine(set);
    }
    set({ proximityAlert: null });
  },
};
});
