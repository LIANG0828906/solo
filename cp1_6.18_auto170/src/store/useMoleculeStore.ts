import { create } from 'zustand';
import { HoverInfo } from '../types';

interface MoleculeState {
  currentMoleculeId: string;
  showLabels: boolean;
  autoRotate: boolean;
  fps: number;
  hoverInfo: HoverInfo | null;
  setCurrentMolecule: (id: string) => void;
  setShowLabels: (show: boolean) => void;
  setAutoRotate: (enabled: boolean) => void;
  setFps: (fps: number) => void;
  setHoverInfo: (info: HoverInfo | null) => void;
}

export const useMoleculeStore = create<MoleculeState>((set) => ({
  currentMoleculeId: 'h2o',
  showLabels: false,
  autoRotate: false,
  fps: 60,
  hoverInfo: null,
  setCurrentMolecule: (id) => set({ currentMoleculeId: id }),
  setShowLabels: (show) => set({ showLabels: show }),
  setAutoRotate: (enabled) => set({ autoRotate: enabled }),
  setFps: (fps) => set({ fps }),
  setHoverInfo: (info) => set({ hoverInfo: info }),
}));
