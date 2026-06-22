import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface HexCoord {
  q: number;
  r: number;
}

export type UnitType = 'assault' | 'sniper' | 'medic';
export type Faction = 'player' | 'enemy';

export interface Unit {
  id: string;
  type: UnitType;
  q: number;
  r: number;
  faction: Faction;
  hasActed: boolean;
  actionPoints: number;
}

interface GameState {
  gridSize: number;
  hexRadius: number;
  units: Unit[];
  selectedUnitId: string | null;
  selectedUnitType: UnitType | null;
  highlightedHexes: HexCoord[];
  currentTurn: number;
  deploymentCount: number;
  maxDeployments: number;
  maxUnits: number;
  deployedThisTurn: Set<UnitType>;
  isAnimating: boolean;
  animationUnitId: string | null;
  animationProgress: number;
  animationPath: HexCoord[];
  
  selectUnit: (id: string | null) => void;
  selectUnitType: (type: UnitType | null) => void;
  deployUnit: (q: number, r: number) => void;
  moveUnit: (unitId: string, q: number, r: number) => void;
  nextTurn: () => void;
  resetGame: () => void;
  setHighlightedHexes: (hexes: HexCoord[]) => void;
  setIsAnimating: (animating: boolean) => void;
  startAnimation: (unitId: string, path: HexCoord[]) => void;
  updateAnimationProgress: (progress: number) => void;
  finishAnimation: () => void;
}

const initialState = {
  gridSize: 8,
  hexRadius: 30,
  units: [],
  selectedUnitId: null,
  selectedUnitType: null,
  highlightedHexes: [],
  currentTurn: 1,
  deploymentCount: 0,
  maxDeployments: 9,
  maxUnits: 3,
  deployedThisTurn: new Set<UnitType>(),
  isAnimating: false,
  animationUnitId: null,
  animationProgress: 0,
  animationPath: []
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  selectUnit: (id: string | null) => {
    set({ selectedUnitId: id, highlightedHexes: [] });
  },

  selectUnitType: (type: UnitType | null) => {
    set({ selectedUnitType: type, selectedUnitId: null, highlightedHexes: [] });
  },

  deployUnit: (q: number, r: number) => {
    const state = get();
    if (!state.selectedUnitType) return;
    if (state.deploymentCount >= state.maxDeployments) return;
    if (state.units.length >= state.maxUnits) return;
    if (state.units.some(u => u.q === q && u.r === r)) return;
    if (state.deployedThisTurn.has(state.selectedUnitType)) return;

    const newUnit: Unit = {
      id: uuidv4(),
      type: state.selectedUnitType,
      q,
      r,
      faction: 'player',
      hasActed: true,
      actionPoints: 1
    };

    const newDeployedThisTurn = new Set(state.deployedThisTurn);
    newDeployedThisTurn.add(state.selectedUnitType);

    set({
      units: [...state.units, newUnit],
      deploymentCount: state.deploymentCount + 1,
      selectedUnitType: null,
      deployedThisTurn: newDeployedThisTurn
    });
  },

  moveUnit: (unitId: string, q: number, r: number) => {
    const state = get();
    const unit = state.units.find(u => u.id === unitId);
    if (!unit || unit.hasActed) return;

    set({
      units: state.units.map(u =>
        u.id === unitId
          ? { ...u, q, r, hasActed: true, actionPoints: u.actionPoints - 1 }
          : u
      ),
      selectedUnitId: null,
      highlightedHexes: []
    });
  },

  nextTurn: () => {
    const state = get();
    set({
      currentTurn: state.currentTurn + 1,
      units: state.units.map(u => ({ ...u, hasActed: false, actionPoints: 1 })),
      selectedUnitId: null,
      selectedUnitType: null,
      highlightedHexes: [],
      deployedThisTurn: new Set<UnitType>()
    });
  },

  resetGame: () => {
    set({
      ...initialState,
      deployedThisTurn: new Set<UnitType>()
    });
  },

  setHighlightedHexes: (hexes: HexCoord[]) => {
    set({ highlightedHexes: hexes });
  },

  setIsAnimating: (animating: boolean) => {
    set({ isAnimating: animating });
  },

  startAnimation: (unitId: string, path: HexCoord[]) => {
    set({
      isAnimating: true,
      animationUnitId: unitId,
      animationPath: path,
      animationProgress: 0
    });
  },

  updateAnimationProgress: (progress: number) => {
    set({ animationProgress: progress });
  },

  finishAnimation: () => {
    const state = get();
    const path = state.animationPath;
    const unitId = state.animationUnitId;
    
    if (unitId && path.length > 0) {
      const endPos = path[path.length - 1];
      const unit = state.units.find(u => u.id === unitId);
      if (unit) {
        set({
          units: state.units.map(u =>
            u.id === unitId
              ? { ...u, q: endPos.q, r: endPos.r, hasActed: true, actionPoints: u.actionPoints - 1 }
              : u
          )
        });
      }
    }
    
    set({
      isAnimating: false,
      animationUnitId: null,
      animationPath: [],
      animationProgress: 0,
      selectedUnitId: null,
      highlightedHexes: []
    });
  }
}));
