import { create } from 'zustand';
import { ICellOrganelle, IAnimationState } from './CellTypes';
import { initOrganelles, updatePositions } from './CellData';
import {
  triggerMitosis as startAnimation,
  getAnimationProgress,
  isAnimating,
  getCurrentPhase,
  setOnProgressCallback,
  setOnCompleteCallback
} from './CellAnimation';

interface CellStore {
  organelles: ICellOrganelle[];
  initialOrganelles: ICellOrganelle[];
  animationState: IAnimationState;
  selectedOrganelle: ICellOrganelle | null;
  initializeOrganelles: () => void;
  selectOrganelle: (organelle: ICellOrganelle | null) => void;
  triggerMitosis: () => void;
  updateAnimationState: () => void;
  setOrganellePositions: (progress: number) => void;
}

function assignCellIndices(organelles: ICellOrganelle[]): ICellOrganelle[] {
  return organelles.map((org, index) => ({
    ...org,
    targetPosition: [...org.position] as [number, number, number],
    cellIndex: org.type === 'nucleus' ? 0 : (index % 2)
  }));
}

export const useCellStore = create<CellStore>((set, get) => ({
  organelles: [],
  initialOrganelles: [],
  animationState: {
    isAnimating: false,
    progress: 0,
    phase: 'idle'
  },
  selectedOrganelle: null,

  initializeOrganelles: () => {
    const orgs = initOrganelles();
    set({
      organelles: orgs,
      initialOrganelles: JSON.parse(JSON.stringify(orgs))
    });
  },

  selectOrganelle: (organelle) => {
    set({ selectedOrganelle: organelle });
  },

  triggerMitosis: () => {
    const state = get();
    if (state.animationState.isAnimating) return;

    const organellesWithIndices = assignCellIndices(state.organelles);
    set({ organelles: organellesWithIndices });

    setOnProgressCallback((progress, phase) => {
      set({
        animationState: {
          isAnimating: true,
          progress,
          phase
        }
      });
      get().setOrganellePositions(progress);
    });

    setOnCompleteCallback(() => {
      const initial = get().initialOrganelles;
      set({
        organelles: JSON.parse(JSON.stringify(initial)),
        animationState: {
          isAnimating: false,
          progress: 0,
          phase: 'idle'
        }
      });
    });

    startAnimation();
  },

  updateAnimationState: () => {
    set({
      animationState: {
        isAnimating: isAnimating(),
        progress: getAnimationProgress(),
        phase: getCurrentPhase()
      }
    });
  },

  setOrganellePositions: (progress: number) => {
    const state = get();
    const updated = updatePositions(state.organelles, progress);
    set({ organelles: updated });
  }
}));
