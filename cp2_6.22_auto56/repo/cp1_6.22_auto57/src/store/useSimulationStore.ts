import { create } from 'zustand';
import type {
  Intersection,
  RoadSegment,
  RoadNetworkData,
  VehicleData,
  ObstacleData,
  HeatmapCell,
  AnalyticsData,
} from '@/types';

function generateDefaultRoadNetwork(): RoadNetworkData {
  const intersections: Intersection[] = [];
  const segments: RoadSegment[] = [];
  const spacing = 60;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const id = `int-${row}-${col}`;
      intersections.push({
        id,
        x: (col - 1) * spacing,
        z: (row - 1) * spacing,
        signalState: row === 1 || col === 1 ? 'green' : 'red',
        signalTimer: 0,
      });
    }
  }

  const getIntersection = (row: number, col: number) => `int-${row}-${col}`;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const isMain = row === 1;
      segments.push({
        id: `seg-h-${row}-${col}`,
        from: getIntersection(row, col),
        to: getIntersection(row, col + 1),
        type: isMain ? 'main' : 'branch',
        lanes: isMain ? 4 : 2,
        speedLimit: isMain ? 60 : 40,
        allowUTurn: isMain,
      });
    }
  }

  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 2; row++) {
      const isMain = col === 1;
      segments.push({
        id: `seg-v-${col}-${row}`,
        from: getIntersection(row, col),
        to: getIntersection(row + 1, col),
        type: isMain ? 'main' : 'branch',
        lanes: isMain ? 4 : 2,
        speedLimit: isMain ? 60 : 40,
        allowUTurn: isMain,
      });
    }
  }

  return {
    intersections,
    segments,
    signalCycle: {
      redDuration: 15,
      greenDuration: 20,
      yellowDuration: 3,
    },
  };
}

function generateDefaultHeatmap(): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const spacing = 60;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      cells.push({
        x: (col - 1) * spacing,
        z: (row - 1) * spacing,
        congestionLevel: 0,
        avgSpeed: 50,
      });
    }
  }
  return cells;
}

interface SimulationStore {
  roadNetwork: RoadNetworkData;
  vehicles: VehicleData[];
  obstacles: ObstacleData[];
  heatmap: HeatmapCell[];
  analytics: AnalyticsData;
  running: boolean;
  signalCycle: { redDuration: number; greenDuration: number; yellowDuration: number };

  setRoadNetwork: (network: RoadNetworkData) => void;
  updateRoadSegment: (segmentId: string, updates: Partial<RoadSegment>) => void;
  addObstacle: (obstacle: ObstacleData) => void;
  removeObstacle: (obstacleId: string) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  updateVehicles: (vehicles: VehicleData[]) => void;
  updateHeatmap: (heatmap: HeatmapCell[]) => void;
  updateAnalytics: (analytics: AnalyticsData) => void;
  setSignalCycle: (cycle: { redDuration: number; greenDuration: number; yellowDuration: number }) => void;
}

const defaultNetwork = generateDefaultRoadNetwork();

export const useSimulationStore = create<SimulationStore>((set) => ({
  roadNetwork: defaultNetwork,
  vehicles: [],
  obstacles: [],
  heatmap: generateDefaultHeatmap(),
  analytics: {
    totalVehicles: 0,
    avgSpeed: 0,
    congestionIndex: 0,
  },
  running: false,
  signalCycle: defaultNetwork.signalCycle,

  setRoadNetwork: (network) => set({ roadNetwork: network, signalCycle: network.signalCycle }),

  updateRoadSegment: (segmentId, updates) =>
    set((state) => ({
      roadNetwork: {
        ...state.roadNetwork,
        segments: state.roadNetwork.segments.map((s) =>
          s.id === segmentId ? { ...s, ...updates } : s
        ),
      },
    })),

  addObstacle: (obstacle) =>
    set((state) => ({
      obstacles: [...state.obstacles, obstacle],
    })),

  removeObstacle: (obstacleId) =>
    set((state) => ({
      obstacles: state.obstacles.filter((o) => o.id !== obstacleId),
    })),

  startSimulation: () => set({ running: true }),

  stopSimulation: () => set({ running: false }),

  updateVehicles: (vehicles) => set({ vehicles }),

  updateHeatmap: (heatmap) => set({ heatmap }),

  updateAnalytics: (analytics) => set({ analytics }),

  setSignalCycle: (cycle) =>
    set((state) => ({
      signalCycle: cycle,
      roadNetwork: {
        ...state.roadNetwork,
        signalCycle: cycle,
      },
    })),
}));
