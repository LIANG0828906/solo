import { create } from 'zustand';
import type { CurvePoint, Marker } from '@/types';

interface SelectedFlavor {
  category: string;
  subFlavor: string;
}

interface BatchStore {
  currentCurveData: CurvePoint[];
  currentMarkers: Marker[];
  currentBeanType: string;
  currentRoastLevel: string;
  selectedFlavors: SelectedFlavor[];
  isRoasting: boolean;
  setCurrentCurveData: (data: CurvePoint[]) => void;
  addCurvePoint: (point: CurvePoint) => void;
  setCurrentMarkers: (markers: Marker[]) => void;
  addMarker: (marker: Marker) => void;
  setBeanType: (beanType: string) => void;
  setRoastLevel: (roastLevel: string) => void;
  addFlavor: (category: string, subFlavor: string) => void;
  removeFlavor: (category: string, subFlavor: string) => void;
  setIsRoasting: (roasting: boolean) => void;
  resetBatch: () => void;
}

const initialState = {
  currentCurveData: [],
  currentMarkers: [],
  currentBeanType: '',
  currentRoastLevel: '',
  selectedFlavors: [],
  isRoasting: false,
};

export const useBatchStore = create<BatchStore>((set) => ({
  ...initialState,

  setCurrentCurveData: (data) => set({ currentCurveData: data }),

  addCurvePoint: (point) =>
    set((state) => ({ currentCurveData: [...state.currentCurveData, point] })),

  setCurrentMarkers: (markers) => set({ currentMarkers: markers }),

  addMarker: (marker) =>
    set((state) => ({ currentMarkers: [...state.currentMarkers, marker] })),

  setBeanType: (beanType) => set({ currentBeanType: beanType }),

  setRoastLevel: (roastLevel) => set({ currentRoastLevel: roastLevel }),

  addFlavor: (category, subFlavor) =>
    set((state) => {
      const exists = state.selectedFlavors.some(
        (f) => f.category === category && f.subFlavor === subFlavor
      );
      if (exists) return state;
      return { selectedFlavors: [...state.selectedFlavors, { category, subFlavor }] };
    }),

  removeFlavor: (category, subFlavor) =>
    set((state) => ({
      selectedFlavors: state.selectedFlavors.filter(
        (f) => !(f.category === category && f.subFlavor === subFlavor)
      ),
    })),

  setIsRoasting: (roasting) => set({ isRoasting: roasting }),

  resetBatch: () => set(initialState),
}));
