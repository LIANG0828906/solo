import { create } from 'zustand';
import { TrafficSimulation } from './simulation';

interface SimulationState {
  simulation: TrafficSimulation;
  isRunning: boolean;
  speed: number;
  init: () => void;
  toggleRunning: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  simulation: new TrafficSimulation(),
  isRunning: false,
  speed: 1,
  init: () => {
    const { simulation } = get();
    simulation.setOnUpdate(() => set({}));
  },
  toggleRunning: () => {
    const { simulation, isRunning } = get();
    if (isRunning) {
      simulation.pause();
    } else {
      simulation.start();
    }
    set({ isRunning: !isRunning });
  },
  reset: () => {
    const { simulation } = get();
    simulation.reset();
    set({ isRunning: false });
  },
  setSpeed: (speed: number) => {
    const { simulation } = get();
    simulation.setSpeed(speed);
    set({ speed });
  },
}));
