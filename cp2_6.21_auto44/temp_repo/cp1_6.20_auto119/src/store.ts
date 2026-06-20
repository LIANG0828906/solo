import { create } from 'zustand';
import type { Turbine, WindParams, TurbineState, PowerDataPoint, PowerLevel } from './types';
import { POWER_LEVEL_CONFIG } from './types';
import { v4 as uuidv4 } from 'uuid';

interface SimulatorStore {
  turbines: Turbine[];
  windParams: WindParams;
  powerLevel: PowerLevel;
  turbineStates: TurbineState[];
  totalPower: number;
  powerHistory: PowerDataPoint[];
  selectedTurbineId: string | null;
  addTurbine: (position: [number, number, number]) => void;
  removeTurbine: (id: string) => void;
  setWindDirection: (direction: number) => void;
  setWindSpeed: (speed: number) => void;
  setPowerLevel: (level: PowerLevel) => void;
  updateSimulation: (states: TurbineState[], totalPower: number) => void;
  selectTurbine: (id: string | null) => void;
  clearTurbines: () => void;
}

export const useSimulatorStore = create<SimulatorStore>((set, get) => ({
  turbines: [],
  windParams: {
    direction: 0,
    speed: 10,
  },
  powerLevel: 2,
  turbineStates: [],
  totalPower: 0,
  powerHistory: [],
  selectedTurbineId: null,

  addTurbine: (position) => {
    const { powerLevel } = get();
    const config = POWER_LEVEL_CONFIG[powerLevel];
    const newTurbine: Turbine = {
      id: uuidv4(),
      position,
      powerLevel,
      rotorDiameter: config.rotorDiameter,
      hubHeight: config.hubHeight,
      ratedPower: config.ratedPower,
      rotationSpeed: 0,
    };
    set((state) => ({
      turbines: [...state.turbines, newTurbine],
    }));
  },

  removeTurbine: (id) => {
    set((state) => ({
      turbines: state.turbines.filter((t) => t.id !== id),
      selectedTurbineId: state.selectedTurbineId === id ? null : state.selectedTurbineId,
    }));
  },

  setWindDirection: (direction) => {
    set((state) => ({
      windParams: { ...state.windParams, direction },
    }));
  },

  setWindSpeed: (speed) => {
    set((state) => ({
      windParams: { ...state.windParams, speed },
    }));
  },

  setPowerLevel: (level) => {
    set({ powerLevel: level });
  },

  updateSimulation: (states, totalPower) => {
    const now = Date.now();
    set((state) => {
      const newHistory = [...state.powerHistory, { time: now, power: totalPower }];
      if (newHistory.length > 120) {
        newHistory.shift();
      }
      return {
        turbineStates: states,
        totalPower,
        powerHistory: newHistory,
      };
    });
  },

  selectTurbine: (id) => {
    set({ selectedTurbineId: id });
  },

  clearTurbines: () => {
    set({ turbines: [], turbineStates: [], totalPower: 0, powerHistory: [], selectedTurbineId: null });
  },
}));
