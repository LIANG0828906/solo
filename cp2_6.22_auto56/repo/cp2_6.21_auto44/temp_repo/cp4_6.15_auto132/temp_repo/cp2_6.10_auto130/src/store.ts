import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlacedMaterial, PaperSize } from './types';
import { MATERIALS } from './data/materials';

interface AppState {
  materials: typeof MATERIALS;
  placedMaterials: PlacedMaterial[];
  selectedId: string | null;
  colorScheme: string;
  gridVisible: boolean;
  paperSize: PaperSize;

  addMaterial: (materialId: string, x: number, y: number, initialColor: string) => void;
  removeMaterial: (id: string) => void;
  updateMaterial: (id: string, updates: Partial<PlacedMaterial>) => void;
  selectMaterial: (id: string | null) => void;
  setColorScheme: (schemeId: string) => void;
  toggleGrid: () => void;
  setPaperSize: (width: number, height: number) => void;
  loadFromStorage: () => void;
  clearAll: () => void;
}

const STORAGE_KEY = 'flower-paper-state';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      materials: MATERIALS,
      placedMaterials: [],
      selectedId: null,
      colorScheme: 'spring',
      gridVisible: false,
      paperSize: { width: 600, height: 400 },

      addMaterial: (materialId: string, x: number, y: number, initialColor: string) => {
        const newMaterial: PlacedMaterial = {
          id: `${materialId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          materialId,
          x,
          y,
          scale: 1,
          angle: 0,
          currentColor: initialColor,
        };
        set((state) => ({
          placedMaterials: [...state.placedMaterials, newMaterial],
          selectedId: newMaterial.id,
        }));
      },

      removeMaterial: (id: string) => {
        set((state) => ({
          placedMaterials: state.placedMaterials.filter((m) => m.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        }));
      },

      updateMaterial: (id: string, updates: Partial<PlacedMaterial>) => {
        set((state) => ({
          placedMaterials: state.placedMaterials.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }));
      },

      selectMaterial: (id: string | null) => {
        set({ selectedId: id });
      },

      setColorScheme: (schemeId: string) => {
        set({ colorScheme: schemeId });
      },

      toggleGrid: () => {
        set((state) => ({ gridVisible: !state.gridVisible }));
      },

      setPaperSize: (width: number, height: number) => {
        set({ paperSize: { width, height } });
      },

      loadFromStorage: () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const data = JSON.parse(stored);
            if (data.state) {
              set(data.state);
            }
          } catch (e) {
            console.error('Failed to load from storage:', e);
          }
        }
      },

      clearAll: () => {
        set({ placedMaterials: [], selectedId: null });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        placedMaterials: state.placedMaterials,
        colorScheme: state.colorScheme,
        gridVisible: state.gridVisible,
        paperSize: state.paperSize,
      }),
    }
  )
);
