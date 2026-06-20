import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Shape,
  Constraint,
  ToolType,
  HistoryState,
  PointShape,
  SegmentShape,
  CircleShape,
  LineShape,
  RayShape,
  PolygonShape,
  ParallelConstraint,
  PerpendicularConstraint,
  MidpointConstraint,
  AngleConstraint,
} from '../types';
import { solveConstraints } from '../core/geometryEngine';

const MAX_HISTORY = 50;

interface CanvasStore {
  shapes: Shape[];
  constraints: Constraint[];
  currentTool: ToolType;
  selectedShapeIds: string[];
  zoom: number;
  pan: { x: number; y: number };
  history: HistoryState[];
  historyIndex: number;
  isPanning: boolean;
  isDragging: boolean;
  dragPointId: string | null;
  mousePos: { x: number; y: number } | null;
  drawingPreview: any;
  constraintSelectionStep: number;
  constraintFirstShapeId: string | null;
  spacePressed: boolean;

  setCurrentTool: (tool: ToolType) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setIsPanning: (panning: boolean) => void;
  setIsDragging: (dragging: boolean) => void;
  setDragPointId: (id: string | null) => void;
  setMousePos: (pos: { x: number; y: number } | null) => void;
  setSpacePressed: (pressed: boolean) => void;

  addPoint: (x: number, y: number) => string;
  addSegment: (startPointId: string, endPointId: string) => string;
  addCircle: (centerId: string, radiusPointId: string) => string;
  addLine: (point1Id: string, point2Id: string) => string;
  addRay: (startPointId: string, directionPointId: string) => string;
  addPolygon: (pointIds: string[], closed?: boolean) => string;

  updatePoint: (id: string, x: number, y: number) => void;
  updatePointWithConstraints: (id: string, x: number, y: number) => void;

  addConstraint: (constraint: any) => string;

  selectShape: (id: string | null, multiSelect?: boolean) => void;
  clearSelection: () => void;

  addToHistory: () => void;
  undo: () => void;
  redo: () => void;

  deleteSelected: () => void;
  clearCanvas: () => void;

  setConstraintSelectionStep: (step: number) => void;
  setConstraintFirstShapeId: (id: string | null) => void;
  resetConstraintSelection: () => void;

  setDrawingPreview: (preview: any) => void;

  importShapes: (shapes: Shape[], constraints: Constraint[]) => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  shapes: [],
  constraints: [],
  currentTool: 'select',
  selectedShapeIds: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
  history: [],
  historyIndex: -1,
  isPanning: false,
  isDragging: false,
  dragPointId: null,
  mousePos: null,
  drawingPreview: null,
  constraintSelectionStep: 0,
  constraintFirstShapeId: null,
  spacePressed: false,

  setCurrentTool: (tool) => {
    set({
      currentTool: tool,
      constraintSelectionStep: 0,
      constraintFirstShapeId: null,
      drawingPreview: null,
    });
  },
  setZoom: (zoom) => set({ zoom: Math.max(0.2, Math.min(5, zoom)) }),
  setPan: (pan) => set({ pan }),
  setIsPanning: (panning) => set({ isPanning: panning }),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  setDragPointId: (id) => set({ dragPointId: id }),
  setMousePos: (pos) => set({ mousePos: pos }),
  setSpacePressed: (pressed) => set({ spacePressed: pressed }),

  addPoint: (x, y) => {
    const id = uuidv4();
    const point: PointShape = {
      id,
      type: 'point',
      x,
      y,
      creating: true,
      createdAt: Date.now(),
    };
    set((state) => ({ shapes: [...state.shapes, point] }));
    setTimeout(() => {
      set((state) => ({
        shapes: state.shapes.map((s) =>
          s.id === id ? { ...s, creating: false } : s
        ),
      }));
    }, 200);
    return id;
  },

  addSegment: (startPointId, endPointId) => {
    const id = uuidv4();
    const segment: SegmentShape = {
      id,
      type: 'segment',
      startPointId,
      endPointId,
      creating: true,
      createdAt: Date.now(),
    };
    set((state) => ({ shapes: [...state.shapes, segment] }));
    setTimeout(() => {
      set((state) => ({
        shapes: state.shapes.map((s) =>
          s.id === id ? { ...s, creating: false } : s
        ),
      }));
    }, 200);
    return id;
  },

  addCircle: (centerId, radiusPointId) => {
    const id = uuidv4();
    const circle: CircleShape = {
      id,
      type: 'circle',
      centerId,
      radiusPointId,
      creating: true,
      createdAt: Date.now(),
    };
    set((state) => ({ shapes: [...state.shapes, circle] }));
    setTimeout(() => {
      set((state) => ({
        shapes: state.shapes.map((s) =>
          s.id === id ? { ...s, creating: false } : s
        ),
      }));
    }, 200);
    return id;
  },

  addLine: (point1Id, point2Id) => {
    const id = uuidv4();
    const line: LineShape = {
      id,
      type: 'line',
      point1Id,
      point2Id,
      creating: true,
      createdAt: Date.now(),
    };
    set((state) => ({ shapes: [...state.shapes, line] }));
    setTimeout(() => {
      set((state) => ({
        shapes: state.shapes.map((s) =>
          s.id === id ? { ...s, creating: false } : s
        ),
      }));
    }, 200);
    return id;
  },

  addRay: (startPointId, directionPointId) => {
    const id = uuidv4();
    const ray: RayShape = {
      id,
      type: 'ray',
      startPointId,
      directionPointId,
      creating: true,
      createdAt: Date.now(),
    };
    set((state) => ({ shapes: [...state.shapes, ray] }));
    setTimeout(() => {
      set((state) => ({
        shapes: state.shapes.map((s) =>
          s.id === id ? { ...s, creating: false } : s
        ),
      }));
    }, 200);
    return id;
  },

  addPolygon: (pointIds, closed = false) => {
    const id = uuidv4();
    const polygon: PolygonShape = {
      id,
      type: 'polygon',
      pointIds,
      closed,
      creating: true,
      createdAt: Date.now(),
    };
    set((state) => ({ shapes: [...state.shapes, polygon] }));
    setTimeout(() => {
      set((state) => ({
        shapes: state.shapes.map((s) =>
          s.id === id ? { ...s, creating: false } : s
        ),
      }));
    }, 200);
    return id;
  },

  updatePoint: (id, x, y) => {
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === id && s.type === 'point' ? { ...s, x, y } : s
      ),
    }));
  },

  updatePointWithConstraints: (id, x, y) => {
    const state = get();
    const fixedPointIds = new Set<string>();

    for (const shape of state.shapes) {
      if (shape.type === 'point' && shape.id !== id) {
        fixedPointIds.add(shape.id);
      }
    }
    fixedPointIds.delete(id);

    let updatedShapes = state.shapes.map((s) =>
      s.id === id && s.type === 'point' ? { ...s, x, y } : s
    );

    updatedShapes = solveConstraints(
      updatedShapes,
      state.constraints,
      fixedPointIds,
      5
    );

    set({ shapes: updatedShapes });
  },

  addConstraint: (constraint) => {
    const id = uuidv4();
    const newConstraint = { ...constraint, id } as Constraint;
    set((state) => ({ constraints: [...state.constraints, newConstraint] }));
    return id;
  },

  selectShape: (id, multiSelect = false) => {
    if (!id) {
      set({ selectedShapeIds: [] });
      return;
    }
    set((state) => {
      if (multiSelect) {
        if (state.selectedShapeIds.includes(id)) {
          return {
            selectedShapeIds: state.selectedShapeIds.filter((s) => s !== id),
          };
        }
        return { selectedShapeIds: [...state.selectedShapeIds, id] };
      }
      return { selectedShapeIds: [id] };
    });
  },

  clearSelection: () => set({ selectedShapeIds: [] }),

  addToHistory: () => {
    const state = get();
    const currentState: HistoryState = {
      shapes: JSON.parse(JSON.stringify(state.shapes)),
      constraints: JSON.parse(JSON.stringify(state.constraints)),
    };

    set((prev) => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(currentState);

      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        return {
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      }

      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      const historyState = state.history[newIndex];
      if (!historyState) return state;
      return {
        shapes: JSON.parse(JSON.stringify(historyState.shapes)),
        constraints: JSON.parse(JSON.stringify(historyState.constraints)),
        historyIndex: newIndex,
        selectedShapeIds: [],
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      const historyState = state.history[newIndex];
      if (!historyState) return state;
      return {
        shapes: JSON.parse(JSON.stringify(historyState.shapes)),
        constraints: JSON.parse(JSON.stringify(historyState.constraints)),
        historyIndex: newIndex,
        selectedShapeIds: [],
      };
    });
  },

  deleteSelected: () => {
    set((state) => {
      const toDelete = new Set(state.selectedShapeIds);
      const pointIdsToDelete = new Set<string>();

      for (const shape of state.shapes) {
        if (toDelete.has(shape.id)) {
          if (shape.type === 'point') {
            pointIdsToDelete.add(shape.id);
          }
        }
      }

      const remainingShapes = state.shapes.filter((s) => {
        if (toDelete.has(s.id)) return false;

        if (s.type === 'segment') {
          if (pointIdsToDelete.has(s.startPointId) || pointIdsToDelete.has(s.endPointId)) {
            return false;
          }
        }
        if (s.type === 'circle') {
          if (pointIdsToDelete.has(s.centerId) || pointIdsToDelete.has(s.radiusPointId)) {
            return false;
          }
        }
        if (s.type === 'line') {
          if (pointIdsToDelete.has(s.point1Id) || pointIdsToDelete.has(s.point2Id)) {
            return false;
          }
        }
        if (s.type === 'ray') {
          if (pointIdsToDelete.has(s.startPointId) || pointIdsToDelete.has(s.directionPointId)) {
            return false;
          }
        }
        if (s.type === 'polygon') {
          if (s.pointIds.some((id) => pointIdsToDelete.has(id))) {
            return false;
          }
        }

        return true;
      });

      const remainingIds = new Set(remainingShapes.map((s) => s.id));
      const remainingConstraints = state.constraints.filter((c) => {
        if (c.type === 'parallel' || c.type === 'perpendicular' || c.type === 'angle') {
          return remainingIds.has(c.segment1Id) && remainingIds.has(c.segment2Id);
        }
        if (c.type === 'midpoint') {
          const pointExists = remainingShapes.some(
            (s) => s.type === 'point' && s.id === c.pointId
          );
          return remainingIds.has(c.segmentId) && pointExists;
        }
        return true;
      });

      return {
        shapes: remainingShapes,
        constraints: remainingConstraints,
        selectedShapeIds: [],
      };
    });
  },

  clearCanvas: () => {
    set({
      shapes: [],
      constraints: [],
      selectedShapeIds: [],
      drawingPreview: null,
      constraintSelectionStep: 0,
      constraintFirstShapeId: null,
    });
  },

  setConstraintSelectionStep: (step) => set({ constraintSelectionStep: step }),
  setConstraintFirstShapeId: (id) => set({ constraintFirstShapeId: id }),

  resetConstraintSelection: () =>
    set({
      constraintSelectionStep: 0,
      constraintFirstShapeId: null,
    }),

  setDrawingPreview: (preview) => set({ drawingPreview: preview }),

  importShapes: (shapes, constraints) => {
    set({
      shapes,
      constraints,
      selectedShapeIds: [],
    });
  },
}));

