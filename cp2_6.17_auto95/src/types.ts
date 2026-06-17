export interface ColorBlock {
  id: string;
  hex: string;
  label: string;
}

export interface Palette {
  id: string;
  name: string;
  colors: ColorBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface VersionSnapshot {
  id: string;
  paletteId: string;
  colors: ColorBlock[];
  timestamp: string;
}

export interface PaletteStore {
  palettes: Palette[];
  selectedPaletteId: string | null;
  versions: Record<string, VersionSnapshot[]>;
  isLoading: boolean;
  isSidebarOpen: boolean;
  isExportModalOpen: boolean;
  selectedPalette: Palette | null;
  init: () => Promise<void>;
  createPalette: (name: string) => Promise<Palette>;
  selectPalette: (id: string | null) => void;
  renamePalette: (id: string, name: string) => Promise<void>;
  deletePalette: (id: string) => Promise<void>;
  addColor: (paletteId: string, hex: string) => Promise<void>;
  updateColor: (paletteId: string, colorId: string, hex: string) => Promise<void>;
  updateColorLabel: (paletteId: string, colorId: string, label: string) => Promise<void>;
  removeColor: (paletteId: string, colorId: string) => Promise<void>;
  reorderColors: (paletteId: string, fromIndex: number, toIndex: number) => Promise<void>;
  saveVersion: (paletteId: string) => Promise<void>;
  restoreVersion: (paletteId: string, versionId: string) => Promise<void>;
  loadVersions: (paletteId: string) => Promise<void>;
  setSidebarOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
}

export type ExportFormat = 'css' | 'tailwind' | 'scss';
