import { create } from 'zustand';

export type ColorPalette = 'nebula' | 'aurora' | 'lava' | 'deepsea' | 'polar';

export interface PaletteColors {
  name: string;
  colors: string[];
}

export const colorPalettes: Record<ColorPalette, PaletteColors> = {
  nebula: {
    name: '星云',
    colors: ['#1a237e', '#6a1b9a', '#c2185b', '#f57c00', '#00bcd4']
  },
  aurora: {
    name: '北极光',
    colors: ['#0d47a1', '#00695c', '#2e7d32', '#76ff03', '#e040fb']
  },
  lava: {
    name: '熔岩',
    colors: ['#b71c1c', '#e64a19', '#ff6f00', '#ffc107', '#fff176']
  },
  deepsea: {
    name: '深海',
    colors: ['#0d1b2a', '#1b263b', '#003566', '#0077b6', '#90e0ef']
  },
  polar: {
    name: '极光',
    colors: ['#3a0ca3', '#4361ee', '#4cc9f0', '#f72585', '#7209b7']
  }
};

interface NebulaState {
  particleCount: number;
  colorPalette: ColorPalette;
  rotationSpeed: number;
  spreadRadius: number;
  particleSize: number;
  trailLength: number;
  isPlaying: boolean;
  isPanelOpen: boolean;
  showExportDialog: boolean;
  exportProgress: number;
  isExporting: boolean;
  exportFormat: 'mp4' | 'gif';
  showHint: boolean;
  resetKey: number;

  setParticleCount: (count: number) => void;
  setColorPalette: (palette: ColorPalette) => void;
  setRotationSpeed: (speed: number) => void;
  setSpreadRadius: (radius: number) => void;
  setParticleSize: (size: number) => void;
  setTrailLength: (length: number) => void;
  togglePlaying: () => void;
  setIsPlaying: (playing: boolean) => void;
  togglePanel: () => void;
  setIsPanelOpen: (open: boolean) => void;
  setShowExportDialog: (show: boolean) => void;
  setExportProgress: (progress: number) => void;
  setIsExporting: (exporting: boolean) => void;
  setExportFormat: (format: 'mp4' | 'gif') => void;
  setShowHint: (show: boolean) => void;
  setResetKey: () => void;
}

export const useNebulaStore = create<NebulaState>((set) => ({
  particleCount: 1000,
  colorPalette: 'nebula',
  rotationSpeed: 1,
  spreadRadius: 1.5,
  particleSize: 0.05,
  trailLength: 0.5,
  isPlaying: true,
  isPanelOpen: true,
  showExportDialog: false,
  exportProgress: 0,
  isExporting: false,
  exportFormat: 'mp4',
  showHint: true,
  resetKey: 0,

  setParticleCount: (count) => set({ particleCount: Math.round(count) }),
  setColorPalette: (palette) => set({ colorPalette: palette }),
  setRotationSpeed: (speed) => set({ rotationSpeed: speed }),
  setSpreadRadius: (radius) => set({ spreadRadius: radius }),
  setParticleSize: (size) => set({ particleSize: size }),
  setTrailLength: (length) => set({ trailLength: length }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  setIsPanelOpen: (open) => set({ isPanelOpen: open }),
  setShowExportDialog: (show) => set({ showExportDialog: show }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setIsExporting: (exporting) => set({ isExporting: exporting }),
  setExportFormat: (format) => set({ exportFormat: format }),
  setShowHint: (show) => set({ showHint: show }),
  setResetKey: () => set((state) => ({ resetKey: state.resetKey + 1 }))
}));
