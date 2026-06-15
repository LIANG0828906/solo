import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type {
  CanvasElement,
  HistoryState,
  PresetElement,
  ResponsiveMode,
  ViewportState,
} from '@/types';
import {
  alignCenterElements,
  distributeHorizontal,
  distributeVertical,
  easeCubicOut,
  lerp,
} from '@/utils/geometry';

const MAX_HISTORY = 10;

interface StoreState {
  elements: CanvasElement[];
  selectedIds: string[];
  viewport: ViewportState;
  gridVisible: boolean;
  isDragging: boolean;
  history: HistoryState;
  sidebarCollapsed: boolean;
  responsiveMode: ResponsiveMode;
  animatingAlign: boolean;
}

interface StoreActions {
  addElement: (preset: PresetElement, x: number, y: number) => void;
  updateElement: (
    id: string,
    patch: Partial<CanvasElement>,
    pushHistory?: boolean
  ) => void;
  deleteElements: (ids: string[]) => void;
  reorderElement: (id: string, targetIndex: number) => void;
  selectElements: (ids: string[], additive?: boolean) => void;
  clearSelection: () => void;

  alignCenter: () => void;
  distributeHorizontal: () => void;
  distributeVertical: () => void;
  _runAlignAnimation: (
    targetMap: Map<string, { x: number; y: number }>
  ) => void;

  undo: () => void;
  redo: () => void;
  _pushHistory: () => void;

  setViewport: (vp: Partial<ViewportState>) => void;
  setGridVisible: (v: boolean) => void;
  setDragging: (v: boolean) => void;

  toggleSidebar: () => void;
  setResponsiveMode: (m: ResponsiveMode) => void;

  toggleVisibility: (id: string) => void;
  applyGlitchShake: (id: string) => void;
}

function cloneElements(els: CanvasElement[]): CanvasElement[] {
  return els.map((e) => ({ ...e }));
}

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  elements: [],
  selectedIds: [],
  viewport: { x: 0, y: 0, scale: 1 },
  gridVisible: false,
  isDragging: false,
  history: { past: [], future: [] },
  sidebarCollapsed: false,
  responsiveMode: 'desktop',
  animatingAlign: false,

  addElement: (preset, x, y) => {
    get()._pushHistory();
    const newEl: CanvasElement = {
      id: uuid(),
      type: preset.type,
      presetId: preset.id,
      name: preset.name,
      x,
      y,
      width: preset.defaultWidth,
      height: preset.defaultHeight,
      rotation: 0,
      color: preset.defaultColor,
      glitchIntensity: 0,
      visible: true,
      zIndex: get().elements.length,
      isNew: true,
    };
    set((s) => ({
      elements: [...s.elements, newEl],
      selectedIds: [newEl.id],
    }));
    setTimeout(() => {
      get().updateElement(newEl.id, { isNew: false }, false);
    }, 500);
  },

  updateElement: (id, patch, pushHistory = false) => {
    if (pushHistory) get()._pushHistory();
    set((s) => ({
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      ),
    }));
  },

  deleteElements: (ids) => {
    if (ids.length === 0) return;
    get()._pushHistory();
    const idSet = new Set(ids);
    let idx = 0;
    set((s) => ({
      elements: s.elements
        .filter((e) => !idSet.has(e.id))
        .map((e) => ({ ...e, zIndex: idx++ })),
      selectedIds: s.selectedIds.filter((id) => !idSet.has(id)),
    }));
  },

  reorderElement: (id, targetIndex) => {
    get()._pushHistory();
    set((s) => {
      const arr = [...s.elements].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndex = arr.findIndex((e) => e.id === id);
      if (currentIndex < 0) return {};
      const [moved] = arr.splice(currentIndex, 1);
      arr.splice(targetIndex, 0, moved);
      return {
        elements: arr.map((e, i) => ({ ...e, zIndex: i })),
      };
    });
  },

  selectElements: (ids, additive = false) => {
    set((s) => ({
      selectedIds: additive
        ? Array.from(new Set([...s.selectedIds, ...ids]))
        : ids,
    }));
  },

  clearSelection: () => set({ selectedIds: [] }),

  alignCenter: () => {
    const { selectedIds, elements } = get();
    if (selectedIds.length === 0) return;
    const selected = elements.filter((e) => selectedIds.includes(e.id));
    const map = alignCenterElements(selected);
    get()._runAlignAnimation(map);
  },

  distributeHorizontal: () => {
    const { selectedIds, elements } = get();
    if (selectedIds.length < 3) return;
    const selected = elements.filter((e) => selectedIds.includes(e.id));
    const map = distributeHorizontal(selected);
    get()._runAlignAnimation(map);
  },

  distributeVertical: () => {
    const { selectedIds, elements } = get();
    if (selectedIds.length < 3) return;
    const selected = elements.filter((e) => selectedIds.includes(e.id));
    const map = distributeVertical(selected);
    get()._runAlignAnimation(map);
  },

  _runAlignAnimation: (targetMap) => {
    get()._pushHistory();
    const { elements } = get();
    const startPositions = new Map<string, { x: number; y: number }>();
    const targets = new Map<string, { x: number; y: number }>();
    elements.forEach((e) => {
      if (targetMap.has(e.id)) {
        startPositions.set(e.id, { x: e.x, y: e.y });
        targets.set(e.id, targetMap.get(e.id)!);
      }
    });
    if (targets.size === 0) return;

    set({ animatingAlign: true });
    const duration = 500;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeCubicOut(t);

      const updates: Record<string, { x: number; y: number }> = {};
      targets.forEach((target, id) => {
        const start = startPositions.get(id)!;
        updates[id] = {
          x: lerp(start.x, target.x, eased),
          y: lerp(start.y, target.y, eased),
        };
      });

      set((s) => ({
        elements: s.elements.map((e) =>
          updates[e.id] ? { ...e, ...updates[e.id] } : e
        ),
      }));

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        set({ animatingAlign: false });
      }
    };

    requestAnimationFrame(tick);
  },

  undo: () => {
    set((s) => {
      if (s.history.past.length === 0) return {};
      const past = [...s.history.past];
      const prev = past.pop()!;
      return {
        elements: cloneElements(prev),
        history: {
          past,
          future: [cloneElements(s.elements), ...s.history.future].slice(
            0,
            MAX_HISTORY
          ),
        },
        selectedIds: [],
      };
    });
  },

  redo: () => {
    set((s) => {
      if (s.history.future.length === 0) return {};
      const future = [...s.history.future];
      const next = future.shift()!;
      return {
        elements: cloneElements(next),
        history: {
          past: [...s.history.past, cloneElements(s.elements)].slice(
            -MAX_HISTORY
          ),
          future,
        },
        selectedIds: [],
      };
    });
  },

  _pushHistory: () => {
    set((s) => ({
      history: {
        past: [...s.history.past, cloneElements(s.elements)].slice(-MAX_HISTORY),
        future: [],
      },
    }));
  },

  setViewport: (vp) => {
    set((s) => ({ viewport: { ...s.viewport, ...vp } }));
  },

  setGridVisible: (v) => set({ gridVisible: v }),
  setDragging: (v) => set({ isDragging: v }),

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setResponsiveMode: (m) => set({ responsiveMode: m }),

  toggleVisibility: (id) => {
    const el = get().elements.find((e) => e.id === id);
    if (!el) return;
    get().updateElement(id, { isFlashing: true }, false);
    setTimeout(() => {
      get().updateElement(
        id,
        { visible: !el.visible, isFlashing: false },
        true
      );
    }, 400);
  },

  applyGlitchShake: (id) => {
    get().updateElement(id, { isGlitching: true }, false);
    setTimeout(() => {
      get().updateElement(id, { isGlitching: false }, false);
    }, 400);
  },
}));
