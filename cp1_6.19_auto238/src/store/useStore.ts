import { create } from 'zustand';
import { SonarParams, EchoData, BeamState } from '@/core/SonarController';
import { TerrainMetrics } from '@/core/TerrainReconstructor';

interface SonarState {
  params: SonarParams;
  echoData: EchoData[];
  beamState: BeamState;
  terrainMetrics: TerrainMetrics;
  isUpdating: boolean;
  updateProgress: number;
  setParams: (params: Partial<SonarParams>) => void;
  setEchoData: (data: EchoData[]) => void;
  setBeamState: (state: BeamState) => void;
  setTerrainMetrics: (metrics: TerrainMetrics) => void;
  setIsUpdating: (updating: boolean) => void;
  setUpdateProgress: (progress: number | ((prev: number) => number)) => void;
}

export const useStore = create<SonarState>((set) => ({
  params: {
    frequency: 80,
    scanAngle: 60,
    pulseWidth: 0.8,
  },
  echoData: [],
  beamState: { progress: 0, active: false },
  terrainMetrics: {
    complexity: 30,
    avgDepth: 20,
    relief: 10,
    coverage: 40,
  },
  isUpdating: false,
  updateProgress: 0,
  setParams: (params) =>
    set((state) => ({ params: { ...state.params, ...params } })),
  setEchoData: (echoData) => set({ echoData }),
  setBeamState: (beamState) => set({ beamState }),
  setTerrainMetrics: (terrainMetrics) => set({ terrainMetrics }),
  setIsUpdating: (isUpdating) => set({ isUpdating }),
  setUpdateProgress: (updateProgress) =>
    set((state) => ({
      updateProgress:
        typeof updateProgress === 'function'
          ? updateProgress(state.updateProgress)
          : updateProgress,
    })),
}));
