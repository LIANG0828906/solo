import { create } from 'zustand';
import { VehicleState, GridConfig, Statistics } from '../engine/types';

interface SimulationState {
  vehicles: VehicleState[];
  statistics: Statistics;
  greenDuration: number;
  gridConfig: GridConfig;
  lodEnabled: boolean;
  followedVehicleId: string | null;
  isTransitioningCamera: boolean;
  actions: {
    setVehicles: (vehicles: VehicleState[]) => void;
    setStatistics: (stats: Statistics) => void;
    setGreenDuration: (n: number) => void;
    regenerateGrid: () => void;
    followVehicle: (id: string | null) => void;
    setLodEnabled: (enabled: boolean) => void;
    setTransitioningCamera: (transitioning: boolean) => void;
  };
}

const defaultGridConfig: GridConfig = {
  sizeX: 4,
  sizeZ: 4,
  roadLength: 200,
  roadWidth: 12,
  intersectionSize: 20
};

const defaultStatistics: Statistics = {
  totalVehicles: 0,
  averageSpeed: 0,
  congestionIndex: 0,
  averageWaitingTime: 0,
  averageQueueLength: 0,
  maxQueueLength: 0,
  trafficFlow: 0,
  completedTrips: 0
};

export const useSimulationStore = create<SimulationState>((set, get) => ({
  vehicles: [],
  statistics: defaultStatistics,
  greenDuration: 30,
  gridConfig: defaultGridConfig,
  lodEnabled: false,
  followedVehicleId: null,
  isTransitioningCamera: false,

  actions: {
    setVehicles: (vehicles: VehicleState[]) => {
      set((state) => ({
        vehicles,
        lodEnabled: vehicles.length > 200,
        followedVehicleId:
          state.followedVehicleId &&
          vehicles.some((v) => v.id === state.followedVehicleId)
            ? state.followedVehicleId
            : null
      }));
    },

    setStatistics: (stats: Statistics) => {
      set({ statistics: stats });
    },

    setGreenDuration: (n: number) => {
      set({ greenDuration: n });
    },

    regenerateGrid: () => {
      const sizeX = Math.floor(Math.random() * 4) + 3;
      const sizeZ = Math.floor(Math.random() * 4) + 3;
      set({
        gridConfig: {
          ...get().gridConfig,
          sizeX,
          sizeZ
        },
        vehicles: [],
        followedVehicleId: null
      });
    },

    followVehicle: (id: string | null) => {
      set({ followedVehicleId: id });
    },

    setLodEnabled: (enabled: boolean) => {
      set({ lodEnabled: enabled });
    },

    setTransitioningCamera: (transitioning: boolean) => {
      set({ isTransitioningCamera: transitioning });
    }
  }
}));

export const useVehicles = () => useSimulationStore((state) => state.vehicles);
export const useStatistics = () => useSimulationStore((state) => state.statistics);
export const useGreenDuration = () =>
  useSimulationStore((state) => state.greenDuration);
export const useGridConfig = () => useSimulationStore((state) => state.gridConfig);
export const useLodEnabled = () => useSimulationStore((state) => state.lodEnabled);
export const useFollowedVehicleId = () =>
  useSimulationStore((state) => state.followedVehicleId);
export const useIsTransitioningCamera = () =>
  useSimulationStore((state) => state.isTransitioningCamera);
export const useSimulationActions = () =>
  useSimulationStore((state) => state.actions);
