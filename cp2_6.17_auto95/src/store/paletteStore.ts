import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { PaletteStore, Palette, ColorBlock, VersionSnapshot } from '../types';
import * as dbManager from '../data/dbManager';

export const usePaletteStore = create<PaletteStore>((set, get) => ({
  palettes: [],
  selectedPaletteId: null,
  versions: {},
  isLoading: false,
  isSidebarOpen: true,
  isExportModalOpen: false,

  get selectedPalette() {
    const { palettes, selectedPaletteId } = get();
    return palettes.find((p) => p.id === selectedPaletteId) || null;
  },

  init: async () => {
    set({ isLoading: true });
    try {
      await dbManager.initDB();
      const palettes = await dbManager.loadPalettes();
      set({
        palettes,
        selectedPaletteId: palettes.length > 0 ? palettes[0].id : null,
        isLoading: false,
      });
      if (palettes.length > 0) {
        await get().loadVersions(palettes[0].id);
      }
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ isLoading: false });
    }
  },

  createPalette: async (name: string) => {
    const now = new Date().toISOString();
    const newPalette: Palette = {
      id: uuidv4(),
      name,
      colors: [],
      createdAt: now,
      updatedAt: now,
    };
    await dbManager.savePalette(newPalette);
    set((state) => ({
      palettes: [newPalette, ...state.palettes],
      selectedPaletteId: newPalette.id,
    }));
    return newPalette;
  },

  selectPalette: (id: string | null) => {
    set({ selectedPaletteId: id });
    if (id) {
      get().loadVersions(id);
    }
  },

  renamePalette: async (id: string, name: string) => {
    const { palettes } = get();
    const palette = palettes.find((p) => p.id === id);
    if (!palette) return;

    const updated = { ...palette, name };
    await dbManager.savePalette(updated);
    set((state) => ({
      palettes: state.palettes.map((p) => (p.id === id ? updated : p)),
    }));
  },

  deletePalette: async (id: string) => {
    await dbManager.deletePalette(id);
    set((state) => {
      const newPalettes = state.palettes.filter((p) => p.id !== id);
      return {
        palettes: newPalettes,
        selectedPaletteId:
          state.selectedPaletteId === id
            ? newPalettes.length > 0
              ? newPalettes[0].id
              : null
            : state.selectedPaletteId,
      };
    });
  },

  addColor: async (paletteId: string, hex: string) => {
    const { palettes, saveVersion } = get();
    const palette = palettes.find((p) => p.id === paletteId);
    if (!palette) return;

    await saveVersion(paletteId);

    const newColor: ColorBlock = {
      id: uuidv4(),
      hex,
      label: '',
    };
    const updated: Palette = {
      ...palette,
      colors: [...palette.colors, newColor],
    };
    await dbManager.savePalette(updated);
    set((state) => ({
      palettes: state.palettes.map((p) => (p.id === paletteId ? updated : p)),
    }));
  },

  updateColor: async (paletteId: string, colorId: string, hex: string) => {
    const { palettes } = get();
    const palette = palettes.find((p) => p.id === paletteId);
    if (!palette) return;

    const updated: Palette = {
      ...palette,
      colors: palette.colors.map((c) => (c.id === colorId ? { ...c, hex } : c)),
    };
    await dbManager.savePalette(updated);
    set((state) => ({
      palettes: state.palettes.map((p) => (p.id === paletteId ? updated : p)),
    }));
  },

  updateColorLabel: async (paletteId: string, colorId: string, label: string) => {
    const { palettes } = get();
    const palette = palettes.find((p) => p.id === paletteId);
    if (!palette) return;

    const truncated = label.slice(0, 10);
    const updated: Palette = {
      ...palette,
      colors: palette.colors.map((c) =>
        c.id === colorId ? { ...c, label: truncated } : c
      ),
    };
    await dbManager.savePalette(updated);
    set((state) => ({
      palettes: state.palettes.map((p) => (p.id === paletteId ? updated : p)),
    }));
  },

  removeColor: async (paletteId: string, colorId: string) => {
    const { palettes, saveVersion } = get();
    const palette = palettes.find((p) => p.id === paletteId);
    if (!palette) return;

    await saveVersion(paletteId);

    const updated: Palette = {
      ...palette,
      colors: palette.colors.filter((c) => c.id !== colorId),
    };
    await dbManager.savePalette(updated);
    set((state) => ({
      palettes: state.palettes.map((p) => (p.id === paletteId ? updated : p)),
    }));
  },

  reorderColors: async (paletteId: string, fromIndex: number, toIndex: number) => {
    const { palettes } = get();
    const palette = palettes.find((p) => p.id === paletteId);
    if (!palette) return;

    const colors = [...palette.colors];
    const [removed] = colors.splice(fromIndex, 1);
    colors.splice(toIndex, 0, removed);

    const updated: Palette = { ...palette, colors };
    await dbManager.savePalette(updated);
    set((state) => ({
      palettes: state.palettes.map((p) => (p.id === paletteId ? updated : p)),
    }));
  },

  saveVersion: async (paletteId: string) => {
    const { palettes } = get();
    const palette = palettes.find((p) => p.id === paletteId);
    if (!palette || palette.colors.length === 0) return;

    const version: VersionSnapshot = {
      id: uuidv4(),
      paletteId,
      colors: JSON.parse(JSON.stringify(palette.colors)),
      timestamp: new Date().toISOString(),
    };
    await dbManager.saveVersion(version);
    await get().loadVersions(paletteId);
  },

  restoreVersion: async (paletteId: string, versionId: string) => {
    const { palettes, versions } = get();
    const palette = palettes.find((p) => p.id === paletteId);
    const version = versions[paletteId]?.find((v) => v.id === versionId);
    if (!palette || !version) return;

    const updated: Palette = {
      ...palette,
      colors: JSON.parse(JSON.stringify(version.colors)),
    };
    await dbManager.savePalette(updated);
    set((state) => ({
      palettes: state.palettes.map((p) => (p.id === paletteId ? updated : p)),
    }));
  },

  loadVersions: async (paletteId: string) => {
    const versions = await dbManager.loadVersions(paletteId);
    set((state) => ({
      versions: { ...state.versions, [paletteId]: versions },
    }));
  },

  setSidebarOpen: (open: boolean) => {
    set({ isSidebarOpen: open });
  },

  setExportModalOpen: (open: boolean) => {
    set({ isExportModalOpen: open });
  },
}));
