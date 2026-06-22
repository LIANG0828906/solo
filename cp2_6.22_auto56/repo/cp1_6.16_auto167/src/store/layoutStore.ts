import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Zone,
  ZoneType,
  ExhibitItem,
  Path,
  PathPoint,
  CanvasState,
  ViewMode,
  MIN_ZONE_SIZE,
  ROTATION_STEP,
  PATH_COLOR,
  PATH_WIDTH,
  THEME_COLORS,
} from '@/types';

interface LayoutStore {
  zones: Zone[];
  paths: Path[];
  selectedZoneId: string | null;
  selectedPathId: string | null;
  currentViewMode: ViewMode;
  canvas: CanvasState;
  isDrawingPath: boolean;
  currentPathPoints: PathPoint[];
  visitorSpeed: number;

  addZone: (type: ZoneType, x: number, y: number) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  deleteZone: (id: string) => void;
  selectZone: (id: string | null) => void;
  bringZoneForward: (id: string) => void;
  sendZoneBackward: (id: string) => void;
  rotateZone: (id: string, direction: 1 | -1) => void;
  addExhibitToZone: (zoneId: string, src: string, name: string) => void;
  updateExhibit: (zoneId: string, exhibitId: string, updates: Partial<ExhibitItem>) => void;
  removeExhibit: (zoneId: string, exhibitId: string) => void;

  startDrawingPath: () => void;
  addPathPoint: (point: PathPoint) => void;
  finishDrawingPath: () => void;
  cancelDrawingPath: () => void;
  updatePath: (id: string, updates: Partial<Path>) => void;
  deletePath: (id: string) => void;

  setViewMode: (mode: ViewMode) => void;
  setCanvas: (updates: Partial<CanvasState>) => void;
  resetCanvas: () => void;
  setVisitorSpeed: (speed: number) => void;

  clearAll: () => void;
  restoreLayout: (zones: Zone[], paths: Path[], canvas: CanvasState) => void;
}

let zoneCounter = 0;

export const useLayoutStore = create<LayoutStore>((set, get) => ({
  zones: [],
  paths: [],
  selectedZoneId: null,
  selectedPathId: null,
  currentViewMode: 'edit',
  canvas: { zoom: 1, offsetX: 0, offsetY: 0 },
  isDrawingPath: false,
  currentPathPoints: [],
  visitorSpeed: 1,

  addZone: (type, x, y) => {
    zoneCounter += 1;
    const newZone: Zone = {
      id: uuidv4(),
      type,
      x,
      y,
      width: 240,
      height: 180,
      rotation: 0,
      zIndex: get().zones.length,
      bgColor: THEME_COLORS[zoneCounter % THEME_COLORS.length].value,
      title: `展区 ${zoneCounter}`,
      note: '',
      exhibits: [],
    };
    set((state) => ({
      zones: [...state.zones, newZone],
      selectedZoneId: newZone.id,
    }));
  },

  updateZone: (id, updates) => {
    set((state) => ({
      zones: state.zones.map((z) => {
        if (z.id !== id) return z;
        const updated = { ...z, ...updates };
        if (updates.width !== undefined) updated.width = Math.max(MIN_ZONE_SIZE, updates.width);
        if (updates.height !== undefined) updated.height = Math.max(MIN_ZONE_SIZE, updates.height);
        return updated;
      }),
    }));
  },

  deleteZone: (id) => {
    set((state) => ({
      zones: state.zones.filter((z) => z.id !== id),
      selectedZoneId: state.selectedZoneId === id ? null : state.selectedZoneId,
    }));
  },

  selectZone: (id) => {
    set({ selectedZoneId: id, selectedPathId: null });
  },

  bringZoneForward: (id) => {
    const zones = [...get().zones];
    const idx = zones.findIndex((z) => z.id === id);
    if (idx < 0) return;
    const maxZ = Math.max(...zones.map((z) => z.zIndex));
    zones[idx] = { ...zones[idx], zIndex: maxZ + 1 };
    set({ zones });
  },

  sendZoneBackward: (id) => {
    const zones = [...get().zones];
    const idx = zones.findIndex((z) => z.id === id);
    if (idx < 0) return;
    const minZ = Math.min(...zones.map((z) => z.zIndex));
    zones[idx] = { ...zones[idx], zIndex: minZ - 1 };
    set({ zones });
  },

  rotateZone: (id, direction) => {
    const zone = get().zones.find((z) => z.id === id);
    if (!zone) return;
    const newRotation = zone.rotation + ROTATION_STEP * direction;
    get().updateZone(id, { rotation: ((newRotation % 360) + 360) % 360 });
  },

  addExhibitToZone: (zoneId, src, name) => {
    set((state) => ({
      zones: state.zones.map((z) => {
        if (z.id !== zoneId) return z;
        const newExhibit: ExhibitItem = {
          id: uuidv4(),
          src,
          name,
          scale: 1,
          label: name,
        };
        return { ...z, exhibits: [...z.exhibits, newExhibit] };
      }),
    }));
  },

  updateExhibit: (zoneId, exhibitId, updates) => {
    set((state) => ({
      zones: state.zones.map((z) => {
        if (z.id !== zoneId) return z;
        return {
          ...z,
          exhibits: z.exhibits.map((e) => {
            if (e.id !== exhibitId) return e;
            const updated = { ...e, ...updates };
            if (updates.scale !== undefined) {
              updated.scale = Math.min(2, Math.max(0.5, updates.scale));
            }
            return updated;
          }),
        };
      }),
    }));
  },

  removeExhibit: (zoneId, exhibitId) => {
    set((state) => ({
      zones: state.zones.map((z) => {
        if (z.id !== zoneId) return z;
        return { ...z, exhibits: z.exhibits.filter((e) => e.id !== exhibitId) };
      }),
    }));
  },

  startDrawingPath: () => {
    set({ isDrawingPath: true, currentPathPoints: [], selectedZoneId: null });
  },

  addPathPoint: (point) => {
    set((state) => {
      if (!state.isDrawingPath) return state;
      const points = [...state.currentPathPoints];
      if (points.length > 0) {
        const prev = points[points.length - 1];
        const bezier = {
          cp1x: prev.x + (point.x - prev.x) * 0.33,
          cp1y: prev.y,
          cp2x: prev.x + (point.x - prev.x) * 0.67,
          cp2y: point.y,
        };
        points[points.length - 1] = { ...prev, bezier };
      }
      points.push(point);
      return { currentPathPoints: points };
    });
  },

  finishDrawingPath: () => {
    const state = get();
    if (state.currentPathPoints.length < 2) {
      get().cancelDrawingPath();
      return;
    }
    const newPath: Path = {
      id: uuidv4(),
      points: state.currentPathPoints,
      color: PATH_COLOR,
      width: PATH_WIDTH,
    };
    set({
      paths: [...state.paths, newPath],
      isDrawingPath: false,
      currentPathPoints: [],
    });
  },

  cancelDrawingPath: () => {
    set({ isDrawingPath: false, currentPathPoints: [] });
  },

  updatePath: (id, updates) => {
    set((state) => ({
      paths: state.paths.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  deletePath: (id) => {
    set((state) => ({
      paths: state.paths.filter((p) => p.id !== id),
      selectedPathId: state.selectedPathId === id ? null : state.selectedPathId,
    }));
  },

  setViewMode: (mode) => {
    set({ currentViewMode: mode });
  },

  setCanvas: (updates) => {
    set((state) => {
      const canvas = { ...state.canvas, ...updates };
      canvas.zoom = Math.min(4, Math.max(0.25, canvas.zoom));
      return { canvas };
    });
  },

  resetCanvas: () => {
    set({ canvas: { zoom: 1, offsetX: 0, offsetY: 0 } });
  },

  setVisitorSpeed: (speed) => {
    set({ visitorSpeed: Math.min(3, Math.max(1, speed)) });
  },

  clearAll: () => {
    set({
      zones: [],
      paths: [],
      selectedZoneId: null,
      selectedPathId: null,
      currentPathPoints: [],
      isDrawingPath: false,
    });
    zoneCounter = 0;
  },

  restoreLayout: (zones, paths, canvas) => {
    zoneCounter = zones.length;
    set({ zones, paths, canvas, selectedZoneId: null, selectedPathId: null });
  },
}));
