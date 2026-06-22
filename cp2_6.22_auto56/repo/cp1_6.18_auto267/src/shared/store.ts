import { create } from 'zustand';

export interface Buoy {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  currentTemp: number;
}

export interface TemperaturePoint {
  timestamp: number;
  temperature: number;
}

export interface CameraState {
  distance: number;
  theta: number;
  phi: number;
  target: { x: number; y: number; z: number };
}

interface OceanStore {
  camera: CameraState;
  buoys: Buoy[];
  selectedBuoyId: string | null;
  temperatureHistory: TemperaturePoint[];
  currentData: Array<{ x: number; z: number; vx: number; vz: number; speed: number }>;
  panelCollapsed: boolean;

  setCamera: (camera: Partial<CameraState>) => void;
  addBuoy: (buoy: Buoy) => void;
  removeBuoy: (id: string) => void;
  selectBuoy: (id: string | null) => void;
  setTemperatureHistory: (data: TemperaturePoint[]) => void;
  setCurrentData: (data: OceanStore['currentData']) => void;
  setPanelCollapsed: (collapsed: boolean) => void;
  updateBuoyTemp: (id: string, temp: number) => void;
}

export const useOceanStore = create<OceanStore>((set) => ({
  camera: {
    distance: 50,
    theta: Math.PI / 4,
    phi: Math.PI / 4,
    target: { x: 0, y: 0, z: 0 }
  },
  buoys: [],
  selectedBuoyId: null,
  temperatureHistory: [],
  currentData: [],
  panelCollapsed: false,

  setCamera: (camera) =>
    set((state) => ({ camera: { ...state.camera, ...camera } })),

  addBuoy: (buoy) =>
    set((state) => {
      if (state.buoys.length >= 5) return state;
      return { buoys: [...state.buoys, buoy] };
    }),

  removeBuoy: (id) =>
    set((state) => ({
      buoys: state.buoys.filter((b) => b.id !== id),
      selectedBuoyId: state.selectedBuoyId === id ? null : state.selectedBuoyId
    })),

  selectBuoy: (id) => set({ selectedBuoyId: id }),

  setTemperatureHistory: (data) => set({ temperatureHistory: data }),

  setCurrentData: (data) => set({ currentData: data }),

  setPanelCollapsed: (collapsed) => set({ panelCollapsed: collapsed }),

  updateBuoyTemp: (id, temp) =>
    set((state) => ({
      buoys: state.buoys.map((b) =>
        b.id === id ? { ...b, currentTemp: temp } : b
      )
    }))
}));
