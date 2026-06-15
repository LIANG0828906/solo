import { create } from 'zustand';
import type { AppStore, FlowDataset, BuildingData, TooltipData } from './types';

const generateFlowData = (buildings: BuildingData[], hourOffset: number = 0): FlowDataset => {
  const currentHour = (new Date().getHours() + hourOffset) % 24;
  const timeFactor = Math.sin((currentHour - 6) * Math.PI / 12) * 0.5 + 0.5;
  
  const buildingsFlow = buildings.map((building) => {
    const baseDensity = Math.random() * 40 + 20;
    const variation = Math.sin(currentHour * 0.5 + building.position[0] * 0.1) * 20;
    const density = Math.min(100, Math.max(0, baseDensity + variation + timeFactor * 30));
    
    const hourlyData: number[] = [];
    for (let i = 0; i < 24; i++) {
      const hFactor = Math.sin((i - 6) * Math.PI / 12) * 0.5 + 0.5;
      const hBase = Math.random() * 30 + 25;
      hourlyData.push(Math.min(100, Math.max(0, hBase + hFactor * 35 + (Math.random() - 0.5) * 10)));
    }
    
    return {
      buildingId: building.id,
      density,
      historicalPeak: Math.max(...hourlyData),
      hourlyData,
    };
  });
  
  const overallIndex = Math.round(
    buildingsFlow.reduce((sum, b) => sum + b.density, 0) / buildingsFlow.length
  );
  
  const trendData: number[] = [];
  for (let i = 0; i <= 60; i += 5) {
    const t = currentHour + i / 60;
    const tFactor = Math.sin((t - 6) * Math.PI / 12) * 0.5 + 0.5;
    trendData.push(overallIndex + tFactor * 15 - 7.5 + (Math.random() - 0.5) * 5);
  }
  
  return {
    timestamp: Date.now(),
    buildings: buildingsFlow,
    overallIndex,
    trendData,
  };
};

export const useAppStore = create<AppStore>((set, get) => ({
  buildings: [],
  flowData: null,
  selectedBuildingId: null,
  hoveredBuildingId: null,
  panel: {
    isExpanded: true,
    position: 'top',
  },
  tooltip: {
    visible: false,
    buildingId: null,
    buildingName: '',
    density: 0,
    historicalPeak: 0,
    position: { x: 0, y: 0 },
  },
  lastUpdateTime: 0,

  setBuildings: (buildings) => {
    const initialFlowData = generateFlowData(buildings);
    set({
      buildings,
      flowData: initialFlowData,
      lastUpdateTime: Date.now(),
    });
  },

  setFlowData: (flowData) => set({ flowData, lastUpdateTime: Date.now() }),

  setSelectedBuilding: (id) => set({ selectedBuildingId: id }),

  setHoveredBuilding: (id) => set({ hoveredBuildingId: id }),

  togglePanel: () =>
    set((state) => ({
      panel: { ...state.panel, isExpanded: !state.panel.isExpanded },
    })),

  setPanelPosition: (position) =>
    set((state) => ({
      panel: { ...state.panel, position },
    })),

  setTooltip: (tooltip) =>
    set((state) => ({
      tooltip: { ...state.tooltip, ...tooltip },
    })),

  updateFlowData: () => {
    const { buildings } = get();
    if (buildings.length > 0) {
      const newFlowData = generateFlowData(buildings);
      set({ flowData: newFlowData, lastUpdateTime: Date.now() });
    }
  },
}));

export { generateFlowData };
