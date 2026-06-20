import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, DayNightMode, FurnitureInstance } from '@/models/types';
import { MORANDI_WALL_COLORS } from '@/models/morandiColors';

export const useAppStore = create<AppState>((set) => ({
  furnitureInstances: [],
  lightIntensity: 1.0,
  wallColor: MORANDI_WALL_COLORS[3].value,
  mode: 'day' as DayNightMode,
  isDraggingNew: null,
  selectedInstanceId: null,
  previewPosition: null,

  addFurniture: (defId: string, pos: [number, number, number]) =>
    set((state) => {
      const newInstance: FurnitureInstance = {
        instanceId: uuidv4(),
        definitionId: defId,
        position: pos,
        rotationY: 0,
        scale: 1,
        themeColorIndex: 0,
      };
      return {
        furnitureInstances: [...state.furnitureInstances, newInstance],
      };
    }),

  removeFurniture: (instanceId: string) =>
    set((state) => ({
      furnitureInstances: state.furnitureInstances.filter(
        (inst) => inst.instanceId !== instanceId
      ),
      selectedInstanceId:
        state.selectedInstanceId === instanceId ? null : state.selectedInstanceId,
    })),

  updateFurniture: (instanceId: string, patch: Partial<FurnitureInstance>) =>
    set((state) => ({
      furnitureInstances: state.furnitureInstances.map((inst) =>
        inst.instanceId === instanceId ? { ...inst, ...patch } : inst
      ),
    })),

  setLightIntensity: (v: number) => set({ lightIntensity: v }),

  setWallColor: (c: string) => set({ wallColor: c }),

  toggleDayNight: () =>
    set((state) => ({
      mode: state.mode === 'day' ? 'night' : 'day',
    })),

  setDraggingNew: (id: string | null) => set({ isDraggingNew: id }),

  selectInstance: (id: string | null) => set({ selectedInstanceId: id }),

  setPreviewPosition: (pos: [number, number, number] | null) => set({ previewPosition: pos }),
}));
