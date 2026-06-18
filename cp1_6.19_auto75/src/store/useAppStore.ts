import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ClothingItem,
  Customization,
  SavedCustomization,
  CarbonStats,
  CarbonHistoryEntry,
  FabricType
} from '../types';
import { fabricData } from '../data/clothing';

interface AppState {
  currentClothing: ClothingItem | null;
  currentCustomization: Customization | null;
  carbonHistory: CarbonHistoryEntry[];
  wishlist: SavedCustomization[];
  carbonStats: CarbonStats;
  selectedPartId: string | null;
  historyStep: number;

  setCurrentClothing: (clothing: ClothingItem | null) => void;
  setCurrentCustomization: (customization: Customization | null) => void;
  updateCustomizationColor: (partId: string, color: string) => void;
  updateCustomizationFabric: (fabric: FabricType) => void;
  addCarbonHistory: (score: number) => void;
  clearCarbonHistory: () => void;
  addToWishlist: (item: SavedCustomization) => void;
  removeFromWishlist: (id: string) => void;
  updateCarbonStats: (fabric: FabricType, carbonSaved: number) => void;
  setSelectedPartId: (partId: string | null) => void;
  resetCustomization: () => void;
}

const initialStats: CarbonStats = {
  totalCarbonSaved: 0,
  ecoClothingCount: 0,
  fabricUsage: {
    organicCotton: 0,
    recycledPolyester: 0,
    tencel: 0,
    hemp: 0
  }
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentClothing: null,
      currentCustomization: null,
      carbonHistory: [],
      wishlist: [],
      carbonStats: initialStats,
      selectedPartId: null,
      historyStep: 0,

      setCurrentClothing: (clothing) => {
        set({ currentClothing: clothing });
        if (clothing) {
          const defaultCustomization: Customization = {
            fabric: clothing.defaultFabric,
            colors: { ...clothing.defaultColors }
          };
          set({
            currentCustomization: defaultCustomization,
            selectedPartId: clothing.parts[0]?.id || null
          });
          get().clearCarbonHistory();
        }
      },

      setCurrentCustomization: (customization) => {
        set({ currentCustomization: customization });
      },

      updateCustomizationColor: (partId, color) => {
        const current = get().currentCustomization;
        if (current) {
          set({
            currentCustomization: {
              ...current,
              colors: {
                ...current.colors,
                [partId]: color
              }
            }
          });
        }
      },

      updateCustomizationFabric: (fabric) => {
        const current = get().currentCustomization;
        if (current) {
          const newColors: Record<string, string> = {};
          const palette = fabricData[fabric].colorPalette;
          Object.keys(current.colors).forEach((partId, index) => {
            newColors[partId] = palette[index % palette.length];
          });
          set({
            currentCustomization: {
              ...current,
              fabric,
              colors: newColors
            }
          });
        }
      },

      addCarbonHistory: (score) => {
        const step = get().historyStep + 1;
        set((state) => ({
          carbonHistory: [
            ...state.carbonHistory,
            {
              step,
              score,
              timestamp: Date.now()
            }
          ],
          historyStep: step
        }));
      },

      clearCarbonHistory: () => {
        set({ carbonHistory: [], historyStep: 0 });
      },

      addToWishlist: (item) => {
        set((state) => ({
          wishlist: [...state.wishlist, item]
        }));
      },

      removeFromWishlist: (id) => {
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.id !== id)
        }));
      },

      updateCarbonStats: (fabric, carbonSaved) => {
        set((state) => ({
          carbonStats: {
            totalCarbonSaved: state.carbonStats.totalCarbonSaved + carbonSaved,
            ecoClothingCount: state.carbonStats.ecoClothingCount + 1,
            fabricUsage: {
              ...state.carbonStats.fabricUsage,
              [fabric]: state.carbonStats.fabricUsage[fabric] + 1
            }
          }
        }));
      },

      setSelectedPartId: (partId) => {
        set({ selectedPartId: partId });
      },

      resetCustomization: () => {
        set({
          currentClothing: null,
          currentCustomization: null,
          selectedPartId: null,
          carbonHistory: [],
          historyStep: 0
        });
      }
    }),
    {
      name: 'eco-fashion-storage',
      partialize: (state) => ({
        wishlist: state.wishlist,
        carbonStats: state.carbonStats
      })
    }
  )
);
