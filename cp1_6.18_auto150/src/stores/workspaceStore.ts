import { create } from 'zustand';
import type { PlacedPart, DragState } from '../types';

interface WorkspaceState {
  parts: PlacedPart[];
  blinkingInstanceId: string | null;
  bouncingInstanceId: string | null;
  drag: DragState;
  addPart: (part: PlacedPart) => void;
  removePart: (instanceId: string) => void;
  updatePart: (instanceId: string, patch: Partial<PlacedPart>) => void;
  clearParts: () => void;
  applyHighlightUpdates: (
    updates: { instanceId: string; isHighlighted: boolean }[]
  ) => void;
  setBlinking: (instanceId: string | null) => void;
  setBouncing: (instanceId: string | null) => void;
  setDrag: (patch: Partial<DragState>) => void;
  resetDrag: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  parts: [],
  blinkingInstanceId: null,
  bouncingInstanceId: null,
  drag: {
    isDragging: false,
    templateId: null,
    instanceId: null,
    mouseX: 0,
    mouseY: 0,
    source: 'panel',
  },

  addPart: (part) =>
    set((state) => ({ parts: [...state.parts, part] })),

  removePart: (instanceId) =>
    set((state) => ({
      parts: state.parts.filter((p) => p.instanceId !== instanceId),
    })),

  updatePart: (instanceId, patch) =>
    set((state) => ({
      parts: state.parts.map((p) =>
        p.instanceId === instanceId ? { ...p, ...patch } : p
      ),
    })),

  clearParts: () => set({ parts: [] }),

  applyHighlightUpdates: (updates) =>
    set((state) => {
      const map = new Map(updates.map((u) => [u.instanceId, u.isHighlighted]));
      return {
        parts: state.parts.map((p) =>
          map.has(p.instanceId)
            ? { ...p, isHighlighted: map.get(p.instanceId)! }
            : p
        ),
      };
    }),

  setBlinking: (instanceId) => set({ blinkingInstanceId: instanceId }),
  setBouncing: (instanceId) => set({ bouncingInstanceId: instanceId }),

  setDrag: (patch) =>
    set((state) => ({ drag: { ...state.drag, ...patch } })),

  resetDrag: () =>
    set({
      drag: {
        isDragging: false,
        templateId: null,
        instanceId: null,
        mouseX: 0,
        mouseY: 0,
        source: 'panel',
      },
    }),
}));
