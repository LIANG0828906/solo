import { create } from 'zustand';
import type {
  BrushConfig,
  BrushStyle,
  DiffusionSpeed,
  InkColor,
  Artwork,
} from '@/types';
import {
  saveArtwork as persistArtwork,
  loadAllArtworks,
  loadArtworkByCode as findArtworkByCode,
  generateShareCode,
  generateId,
} from '@/services/storageService';

interface AppState {
  brushConfig: BrushConfig;
  artworks: Artwork[];
  isPlaying: boolean;
  currentPlayback: Artwork | null;
  shareDialogOpen: boolean;
  shareCodeInput: string;
  lastSavedCode: string | null;
  codeNotification: { show: boolean; code: string | null; type: 'save' | 'load' | 'error' };

  setBrushConfig: (config: Partial<BrushConfig>) => void;
  setInkColor: (color: InkColor) => void;
  setBrushStyle: (style: BrushStyle) => void;
  setDiffusionSpeed: (speed: DiffusionSpeed) => void;

  initArtworks: () => void;
  saveArtwork: (data: Omit<Artwork, 'id' | 'shareCode' | 'createdAt'>) => string;
  loadArtworkByCode: (code: string) => Artwork | undefined;
  deleteArtwork: (id: string) => void;

  startPlayback: (artwork: Artwork) => void;
  stopPlayback: () => void;

  openShareDialog: () => void;
  closeShareDialog: () => void;
  setShareCodeInput: (code: string) => void;
  submitShareCode: () => Artwork | undefined;

  showCodeNotification: (code: string | null, type: 'save' | 'load' | 'error') => void;
  hideCodeNotification: () => void;
  clearLastSavedCode: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  brushConfig: {
    inkColor: '#1A1A1A',
    brushStyle: 'ripple',
    diffusionSpeed: 1,
  },
  artworks: [],
  isPlaying: false,
  currentPlayback: null,
  shareDialogOpen: false,
  shareCodeInput: '',
  lastSavedCode: null,
  codeNotification: { show: false, code: null, type: 'save' },

  setBrushConfig: (config) =>
    set((s) => ({ brushConfig: { ...s.brushConfig, ...config } })),
  setInkColor: (color) =>
    set((s) => ({ brushConfig: { ...s.brushConfig, inkColor: color } })),
  setBrushStyle: (style) =>
    set((s) => ({ brushConfig: { ...s.brushConfig, brushStyle: style } })),
  setDiffusionSpeed: (speed) =>
    set((s) => ({ brushConfig: { ...s.brushConfig, diffusionSpeed: speed } })),

  initArtworks: () => {
    const all = loadAllArtworks();
    set({ artworks: all });
  },

  saveArtwork: (data) => {
    const shareCode = generateShareCode();
    const artwork: Artwork = {
      ...data,
      id: generateId(),
      shareCode,
      createdAt: Date.now(),
    };
    persistArtwork(artwork);
    const all = loadAllArtworks();
    set({ artworks: all, lastSavedCode: shareCode });
    get().showCodeNotification(shareCode, 'save');
    return shareCode;
  },

  loadArtworkByCode: (code) => {
    return findArtworkByCode(code);
  },

  deleteArtwork: (id) => {
    // implement if needed; currently storage service has removeArtwork
  },

  startPlayback: (artwork) => {
    set({ isPlaying: true, currentPlayback: artwork });
  },
  stopPlayback: () => {
    set({ isPlaying: false, currentPlayback: null });
  },

  openShareDialog: () => set({ shareDialogOpen: true, shareCodeInput: '' }),
  closeShareDialog: () => set({ shareDialogOpen: false }),
  setShareCodeInput: (code) => set({ shareCodeInput: code.toUpperCase() }),

  submitShareCode: () => {
    const code = get().shareCodeInput.trim();
    if (code.length !== 6) {
      get().showCodeNotification(null, 'error');
      return undefined;
    }
    const found = findArtworkByCode(code);
    if (found) {
      get().showCodeNotification(code, 'load');
      set({ shareDialogOpen: false });
      get().startPlayback(found);
      return found;
    } else {
      get().showCodeNotification(null, 'error');
      return undefined;
    }
  },

  showCodeNotification: (code, type) => {
    set({ codeNotification: { show: true, code, type } });
    setTimeout(() => {
      get().hideCodeNotification();
    }, 4000);
  },
  hideCodeNotification: () =>
    set((s) => ({ codeNotification: { ...s.codeNotification, show: false } })),
  clearLastSavedCode: () => set({ lastSavedCode: null }),
}));
