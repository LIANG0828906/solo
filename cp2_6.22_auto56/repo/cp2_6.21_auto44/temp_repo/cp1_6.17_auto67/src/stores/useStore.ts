import { create } from 'zustand';
import type { ComponentConfig, DiffResult, VersionSnapshot } from '@/types';

interface AppState {
  jsonConfig: string;
  jsonError: string | null;
  versions: VersionSnapshot[];
  selectedVersionId: string | null;
  snapshotADataURL: string | null;
  snapshotBDataURL: string | null;
  diffResult: DiffResult | null;
  isComparing: boolean;
  zoomLevel: number;
  drawerOpen: boolean;

  setJsonConfig: (value: string) => void;
  setJsonError: (error: string | null) => void;
  addVersion: (version: VersionSnapshot) => void;
  removeVersion: (id: string) => void;
  selectVersion: (id: string | null) => void;
  setSnapshotADataURL: (url: string | null) => void;
  setSnapshotBDataURL: (url: string | null) => void;
  setDiffResult: (result: DiffResult | null) => void;
  setIsComparing: (value: boolean) => void;
  setZoomLevel: (level: number) => void;
  setDrawerOpen: (open: boolean) => void;
  loadVersionConfig: (id: string) => void;
}

const defaultButtonConfig: ComponentConfig = {
  type: 'Button',
  props: { text: 'Click Me', variant: 'primary', size: 'medium', disabled: false },
};

const defaultJsonConfig = JSON.stringify(defaultButtonConfig, null, 2);

export const useStore = create<AppState>((set, get) => ({
  jsonConfig: defaultJsonConfig,
  jsonError: null,
  versions: [],
  selectedVersionId: null,
  snapshotADataURL: null,
  snapshotBDataURL: null,
  diffResult: null,
  isComparing: false,
  zoomLevel: 1,
  drawerOpen: false,

  setJsonConfig: (value) => {
    try {
      JSON.parse(value);
      set({ jsonConfig: value, jsonError: null });
    } catch (e) {
      set({ jsonConfig: value, jsonError: (e as Error).message });
    }
  },

  setJsonError: (error) => set({ jsonError: error }),

  addVersion: (version) =>
    set((state) => {
      const existing = state.versions.findIndex((v) => v.label === version.label);
      const newVersions = [...state.versions];
      if (existing >= 0) {
        newVersions[existing] = version;
      } else {
        newVersions.push(version);
      }
      return { versions: newVersions };
    }),

  removeVersion: (id) =>
    set((state) => ({ versions: state.versions.filter((v) => v.id !== id) })),

  selectVersion: (id) => set({ selectedVersionId: id }),

  setSnapshotADataURL: (url) => set({ snapshotADataURL: url }),
  setSnapshotBDataURL: (url) => set({ snapshotBDataURL: url }),

  setDiffResult: (result) => set({ diffResult: result }),

  setIsComparing: (value) => set({ isComparing: value }),

  setZoomLevel: (level) => set({ zoomLevel: level }),

  setDrawerOpen: (open) => set({ drawerOpen: open }),

  loadVersionConfig: (id) => {
    const version = get().versions.find((v) => v.id === id);
    if (version) {
      set({
        jsonConfig: JSON.stringify(version.config, null, 2),
        jsonError: null,
        selectedVersionId: id,
      });
    }
  },
}));
