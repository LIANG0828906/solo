import { create } from 'zustand';
import type { EnvParams, Species, RenderableSpecies, MonthForecast } from './types';
import { loadSpeciesData, speciesToRenderable } from './dataLoader';
import { recalculate, generate12MonthForecast } from './simulationEngine';

interface OceanStore {
  envParams: EnvParams;
  speciesList: Species[];
  renderableData: RenderableSpecies[];
  hoveredSpecies: RenderableSpecies | null;
  selectedSpecies: RenderableSpecies | null;
  isSimulating: boolean;
  simulationMonth: number;
  forecastData: MonthForecast[] | null;
  showReport: boolean;
  setEnvParams: (params: Partial<EnvParams>) => void;
  setHoveredSpecies: (sp: RenderableSpecies | null) => void;
  setSelectedSpecies: (sp: RenderableSpecies | null) => void;
  startSimulation: () => void;
  setSimulationMonth: (m: number) => void;
  endSimulation: () => void;
  setShowReport: (show: boolean) => void;
  initialize: () => void;
}

export const useOceanStore = create<OceanStore>((set, get) => ({
  envParams: {
    temperature: 20,
    salinity: 35,
    lightPenetration: 80,
  },
  speciesList: [],
  renderableData: [],
  hoveredSpecies: null,
  selectedSpecies: null,
  isSimulating: false,
  simulationMonth: 0,
  forecastData: null,
  showReport: false,

  setEnvParams: (params) => {
    const newParams = { ...get().envParams, ...params };
    const { speciesList } = get();
    const renderable = recalculate(speciesList, newParams);
    set({ envParams: newParams, renderableData: renderable });
  },

  setHoveredSpecies: (sp) => set({ hoveredSpecies: sp }),
  setSelectedSpecies: (sp) => set({ selectedSpecies: sp }),

  startSimulation: () => {
    const { envParams, speciesList } = get();
    const forecasts = generate12MonthForecast(speciesList, envParams);
    set({
      isSimulating: true,
      simulationMonth: 1,
      forecastData: forecasts,
      showReport: false,
      renderableData: forecasts[0]?.speciesData || [],
    });
  },

  setSimulationMonth: (m) => {
    const { forecastData } = get();
    if (forecastData && m <= 12) {
      set({
        simulationMonth: m,
        renderableData: forecastData[m - 1]?.speciesData || [],
      });
    }
  },

  endSimulation: () => {
    set({ isSimulating: false, showReport: true });
  },

  setShowReport: (show) => set({ showReport: show }),

  initialize: () => {
    const species = loadSpeciesData();
    const envParams = get().envParams;
    const renderable = speciesToRenderable(species, envParams);
    set({ speciesList: species, renderableData: renderable });
  },
}));
