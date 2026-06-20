import { create } from 'zustand';
import {
  CuttingPieceData,
  PieceShape,
  LeatherDefect,
  LayoutScheme,
  LeatherMaterialConfig,
  LayoutParams,
  OptimizationProgress,
  LayoutState,
  LayoutActions,
  PIECE_COLORS,
  LEATHER_BOUNDS,
  MAX_SCHEMES,
  OPTIMIZATION_ITERATIONS,
  SHAPE_DEFAULTS,
} from '@/types';
import { createLeatherMaterial } from '@/modules/leather/LeatherModel';
import { CuttingLayout } from '@/modules/cutting/CuttingLayout';
import { LayoutOptimizer } from '@/modules/cutting/LayoutOptimizer';
import { calculateTotalUtilization, isAnyCollision } from '@/utils/collision';
import { generateDefectPositions, generateThumbnail } from '@/utils/textureGenerator';

let pieceCounter = 0;

function createPiece(shape: PieceShape): CuttingPieceData {
  const id = `piece-${Date.now()}-${pieceCounter++}`;
  const defaults = SHAPE_DEFAULTS[shape];
  const hw = LEATHER_BOUNDS.width / 2;
  const hh = LEATHER_BOUNDS.height / 2;
  return {
    id,
    shape,
    position: {
      x: (Math.random() - 0.5) * (LEATHER_BOUNDS.width * 0.6),
      y: (Math.random() - 0.5) * (LEATHER_BOUNDS.height * 0.6),
    },
    rotation: 0,
    scale: 1,
    width: defaults.width,
    height: defaults.height,
    color: PIECE_COLORS[shape],
    isColliding: false,
    isDragging: false,
  };
}

const defaultParams: LayoutParams = {
  scaleRatio: 1,
  rotationAngle: 0,
  layoutDensity: 0.5,
};

const defaultDefects = generateDefectPositions();

export const useLayoutStore = create<LayoutState & LayoutActions>((set, get) => {
  const layout = new CuttingLayout();

  return {
    pieces: [],
    selectedPieceId: null,
    leatherMaterial: createLeatherMaterial(),
    defects: defaultDefects,
    schemes: [],
    currentSchemeId: null,
    showCuttingPath: false,
    optimizationProgress: {
      currentIteration: 0,
      totalIterations: OPTIMIZATION_ITERATIONS,
      currentUtilization: 0,
      isRunning: false,
    },
    utilization: 0,
    params: { ...defaultParams },
    pendingParams: { ...defaultParams },
    paramsDirty: false,
    sceneFadeKey: 0,

    addPiece: (shape: PieceShape) => {
      const state = get();
      if (state.pieces.length >= 30) return;
      const piece = createPiece(shape);
      const newPieces = [...state.pieces, piece];
      const utilization = calculateTotalUtilization(newPieces, state.defects);
      layout.pieces = newPieces;
      set({ pieces: newPieces, utilization });
    },

    removePiece: (id: string) => {
      const state = get();
      const newPieces = state.pieces.filter((p) => p.id !== id);
      const utilization = calculateTotalUtilization(newPieces, state.defects);
      layout.pieces = newPieces;
      set({
        pieces: newPieces,
        utilization,
        selectedPieceId: state.selectedPieceId === id ? null : state.selectedPieceId,
      });
    },

    updatePiece: (id: string, updates: Partial<CuttingPieceData>) => {
      const state = get();
      const newPieces = state.pieces.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );

      const updatedPiece = newPieces.find((p) => p.id === id);
      let collisionState = false;
      if (updatedPiece) {
        collisionState = isAnyCollision(updatedPiece, newPieces, state.defects);
        const idx = newPieces.findIndex((p) => p.id === id);
        if (idx !== -1) {
          newPieces[idx] = { ...newPieces[idx], isColliding: collisionState };
        }
      }

      const utilization = calculateTotalUtilization(newPieces, state.defects);
      layout.pieces = newPieces;
      set({ pieces: newPieces, utilization });
    },

    selectPiece: (id: string | null) => {
      set({ selectedPieceId: id });
    },

    setParams: (params: Partial<LayoutParams>) => {
      const state = get();
      const newPending = { ...state.pendingParams, ...params };
      const dirty =
        newPending.scaleRatio !== state.params.scaleRatio ||
        newPending.rotationAngle !== state.params.rotationAngle ||
        newPending.layoutDensity !== state.params.layoutDensity;
      set({ pendingParams: newPending, paramsDirty: dirty });
    },

    applyParams: async () => {
      const state = get();
      const { pendingParams } = state;
      const newPieces = state.pieces.map((p) => ({
        ...p,
        scale: pendingParams.scaleRatio,
        rotation: pendingParams.rotationAngle * (Math.PI / 180),
      }));

      set({
        pieces: newPieces,
        params: { ...pendingParams },
        paramsDirty: false,
        utilization: calculateTotalUtilization(newPieces, state.defects),
        optimizationProgress: {
          ...state.optimizationProgress,
          isRunning: true,
          currentIteration: 0,
          currentUtilization: 0,
        },
      });

      const optimizer = new LayoutOptimizer((iteration, utilization) => {
        set((s) => ({
          optimizationProgress: {
            ...s.optimizationProgress,
            currentIteration: iteration,
            currentUtilization: utilization,
          },
        }));
      });

      const optimizedPieces = await optimizer.optimize(newPieces, pendingParams.layoutDensity);
      const finalUtilization = calculateTotalUtilization(optimizedPieces, state.defects);
      layout.pieces = optimizedPieces;

      set({
        pieces: optimizedPieces,
        utilization: finalUtilization,
        optimizationProgress: {
          currentIteration: OPTIMIZATION_ITERATIONS,
          totalIterations: OPTIMIZATION_ITERATIONS,
          currentUtilization: finalUtilization,
          isRunning: false,
        },
      });
    },

    toggleCuttingPath: () => {
      set((state) => ({ showCuttingPath: !state.showCuttingPath }));
    },

    runOptimization: async () => {
      const state = get();
      if (state.optimizationProgress.isRunning) return;
      if (state.pieces.length === 0) return;

      set({
        optimizationProgress: {
          ...state.optimizationProgress,
          isRunning: true,
          currentIteration: 0,
          currentUtilization: 0,
        },
      });

      const optimizer = new LayoutOptimizer((iteration, utilization) => {
        set((s) => ({
          optimizationProgress: {
            ...s.optimizationProgress,
            currentIteration: iteration,
            currentUtilization: utilization,
          },
        }));
      });

      const optimizedPieces = await optimizer.optimize(state.pieces, state.params.layoutDensity);

      const finalUtilization = calculateTotalUtilization(optimizedPieces, state.defects);
      layout.pieces = optimizedPieces;

      set({
        pieces: optimizedPieces,
        utilization: finalUtilization,
        optimizationProgress: {
          currentIteration: OPTIMIZATION_ITERATIONS,
          totalIterations: OPTIMIZATION_ITERATIONS,
          currentUtilization: finalUtilization,
          isRunning: false,
        },
      });
    },

    saveScheme: () => {
      const state = get();
      if (state.schemes.length >= MAX_SCHEMES) {
        const oldest = state.schemes[state.schemes.length - 1];
        layout.pieces = state.pieces;
        const scheme = layout.generateScheme(
          `方案 ${state.schemes.length + 1}`,
          state.defects
        );
        set({
          schemes: [...state.schemes.slice(1), scheme],
          currentSchemeId: scheme.id,
        });
      } else {
        layout.pieces = state.pieces;
        const scheme = layout.generateScheme(
          `方案 ${state.schemes.length + 1}`,
          state.defects
        );
        set({
          schemes: [...state.schemes, scheme],
          currentSchemeId: scheme.id,
        });
      }
    },

    loadScheme: (id: string) => {
      const state = get();
      const scheme = state.schemes.find((s) => s.id === id);
      if (!scheme) return;
      const pieces = layout.loadScheme(scheme);
      const utilization = calculateTotalUtilization(pieces, state.defects);
      set({
        pieces: [...pieces],
        utilization,
        currentSchemeId: id,
        sceneFadeKey: state.sceneFadeKey + 1,
      });
    },

    deleteScheme: (id: string) => {
      const state = get();
      set({
        schemes: state.schemes.filter((s) => s.id !== id),
        currentSchemeId: state.currentSchemeId === id ? null : state.currentSchemeId,
      });
    },

    clearAll: () => {
      layout.clear();
      set({
        pieces: [],
        utilization: 0,
        selectedPieceId: null,
        params: { ...defaultParams },
        pendingParams: { ...defaultParams },
        paramsDirty: false,
      });
    },

    calculateUtilization: () => {
      const state = get();
      return calculateTotalUtilization(state.pieces, state.defects);
    },

    setSceneFadeKey: (key: number) => {
      set({ sceneFadeKey: key });
    },
  };
});
