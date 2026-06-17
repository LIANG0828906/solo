import { create } from 'zustand';

interface MoleculeStore {
  currentMolecule: string;
  viewDistance: number;
  horizontalRotation: number;
  verticalTilt: number;
  showLabels: boolean;
  autoRotate: boolean;
  setCurrentMolecule: (mol: string) => void;
  setViewDistance: (d: number) => void;
  setHorizontalRotation: (r: number) => void;
  setVerticalTilt: (t: number) => void;
  setShowLabels: (show: boolean) => void;
  setAutoRotate: (auto: boolean) => void;
}

export const useMoleculeStore = create<MoleculeStore>((set) => ({
  currentMolecule: 'water',
  viewDistance: 10,
  horizontalRotation: 0,
  verticalTilt: 0,
  showLabels: true,
  autoRotate: true,
  setCurrentMolecule: (mol) => set({ currentMolecule: mol }),
  setViewDistance: (d) => set({ viewDistance: d }),
  setHorizontalRotation: (r) => set({ horizontalRotation: r }),
  setVerticalTilt: (t) => set({ verticalTilt: t }),
  setShowLabels: (show) => set({ showLabels: show }),
  setAutoRotate: (auto) => set({ autoRotate: auto }),
}));
