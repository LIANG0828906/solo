import { create } from 'zustand';
import type { Cargo, Town, Risk, RouteNode, CostCalculationResponse } from './types';

interface AppState {
  selectedCargo: Cargo[];
  route: RouteNode[];
  calculationResult: CostCalculationResponse | null;
  mapScale: number;
  mapOffset: { x: number; y: number };
  towns: Town[];
  cargoTypes: Cargo[];
  risks: Risk[];
  caravanSize: number;
  isCalculating: boolean;
  debouncedCalculate: () => void;
  setCaravanSize: (size: number) => void;
  addCargo: (cargo: Cargo) => void;
  removeCargo: (cargoId: string) => void;
  updateCargoQuantity: (cargoId: string, quantity: number) => void;
  addTownToRoute: (townId: string) => void;
  removeTownFromRoute: (townId: string) => void;
  reorderRoute: (fromIndex: number, toIndex: number) => void;
  clearRoute: () => void;
  calculateCosts: () => Promise<void>;
  setMapTransform: (scale: number, offset: { x: number; y: number }) => void;
  loadReferenceData: () => Promise<void>;
}

const debounce = <T extends (...args: unknown[]) => void>(fn: T, delay: number) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const useAppStore = create<AppState>((set, get) => ({
  selectedCargo: [],
  route: [],
  calculationResult: null,
  mapScale: 1,
  mapOffset: { x: 0, y: 0 },
  towns: [],
  cargoTypes: [],
  risks: [],
  caravanSize: 10,
  isCalculating: false,

  setCaravanSize: (size: number) => {
    set({ caravanSize: size });
    get().debouncedCalculate();
  },

  addCargo: (cargo: Cargo) => {
    set((state) => {
      const existing = state.selectedCargo.find((c) => c.id === cargo.id);
      if (existing) {
        return {
          selectedCargo: state.selectedCargo.map((c) =>
            c.id === cargo.id ? { ...c, quantity: c.quantity + cargo.quantity } : c
          ),
        };
      }
      return { selectedCargo: [...state.selectedCargo, cargo] };
    });
    get().debouncedCalculate();
  },

  removeCargo: (cargoId: string) => {
    set((state) => ({
      selectedCargo: state.selectedCargo.filter((c) => c.id !== cargoId),
    }));
    get().debouncedCalculate();
  },

  updateCargoQuantity: (cargoId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeCargo(cargoId);
      return;
    }
    set((state) => ({
      selectedCargo: state.selectedCargo.map((c) =>
        c.id === cargoId ? { ...c, quantity } : c
      ),
    }));
    get().debouncedCalculate();
  },

  addTownToRoute: (townId: string) => {
    set((state) => {
      if (state.route.find((r) => r.townId === townId)) return state;
      return {
        route: [...state.route, { townId, order: state.route.length }],
      };
    });
    get().debouncedCalculate();
  },

  removeTownFromRoute: (townId: string) => {
    set((state) => ({
      route: state.route
        .filter((r) => r.townId !== townId)
        .map((r, i) => ({ ...r, order: i })),
    }));
    get().debouncedCalculate();
  },

  reorderRoute: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newRoute = [...state.route];
      const [removed] = newRoute.splice(fromIndex, 1);
      newRoute.splice(toIndex, 0, removed);
      return {
        route: newRoute.map((r, i) => ({ ...r, order: i })),
      };
    });
    get().debouncedCalculate();
  },

  clearRoute: () => {
    set({ route: [] });
    get().debouncedCalculate();
  },

  calculateCosts: async () => {
    const state = get();
    if (state.route.length < 2 || state.selectedCargo.length === 0) {
      set({ calculationResult: null });
      return;
    }

    set({ isCalculating: true });
    try {
      const response = await fetch('/api/calculate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cargo: state.selectedCargo,
          route: state.route,
          caravanSize: state.caravanSize,
        }),
      });
      const result = await response.json();
      set({ calculationResult: result, isCalculating: false });
    } catch {
      set({ isCalculating: false });
    }
  },

  debouncedCalculate: debounce(() => {
    get().calculateCosts();
  }, 300),

  setMapTransform: (scale: number, offset: { x: number; y: number }) => {
    set({ mapScale: scale, mapOffset: offset });
  },

  loadReferenceData: async () => {
    try {
      const [towns, cargoTypes, risks] = await Promise.all([
        fetch('/api/towns').then((r) => r.json()),
        fetch('/api/cargo-types').then((r) => r.json()),
        fetch('/api/risks').then((r) => r.json()),
      ]);
      set({ towns, cargoTypes, risks });
    } catch {
      console.error('Failed to load reference data');
    }
  },
}));
